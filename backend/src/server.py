import json
import logging
import time
from typing import Optional, cast

from flask import Flask, request
from flask_socketio import SocketIO
from qbruntime import Accelerator
from threading import Lock

from pipeline_handler import LLMHandler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

DEFAULT_MODEL_REVISION = "main"

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")


def normalize_model_config(model: dict) -> dict:
    normalized = dict(model)
    revision = normalized.get("revision")
    if isinstance(revision, str):
        revision = revision.strip()
    normalized["revision"] = revision or DEFAULT_MODEL_REVISION
    generation_config_override = normalized.get("generation_config_override")
    normalized["generation_config_override"] = generation_config_override if isinstance(generation_config_override, dict) else {}
    normalized["disable_thinking"] = bool(normalized.get("disable_thinking", False))
    return normalized


with open("src/models.json", "r", encoding="UTF-8") as f:
    models = [normalize_model_config(model) for model in json.load(f)]

is_mla_400 = True

try:
    for i in range(4):
        acc = Accelerator(dev_no=i)
        del acc
except Exception:
    is_mla_400 = False

if is_mla_400 == False:
    models = models[::4]
    target_cores = ["0:0", "0:2", "1:1", "1:3"]
    for index, model in enumerate(models):
        model["dev_no"] = 0
        model["target_cores"] = [target_cores[index]]

model_ids = [model["model_id"] for model in models]
assert len(model_ids) == len(set(model_ids)), "Model IDs are not unique!"

handlers = {model["model_id"]: LLMHandler(**model) for model in models}

task_lists = {handler.model_id: [] for handler in handlers.values()}
task_locks = {handler.model_id: Lock() for handler in handlers.values()}

current_session_id: Optional[str] = None
prompt_config_ready = False


def emit_loading_state():
    socketio.emit("loading_state", {
        "is_loading": False,
        "is_ready": True,
        "error": None,
    }, to=current_session_id)


def emit_prompt_config_state(is_ready: bool, message: Optional[str] = None):
    socketio.emit("prompt_config_state", {
        "is_ready": is_ready,
        "message": message,
    }, to=current_session_id)


def clear_all_queued_tasks():
    for model_id in handlers.keys():
        with task_locks[model_id]:
            task_lists[model_id] = []
            socketio.emit("tasks", (model_id, 0), to=current_session_id)


def abort_all_handlers(reason: str = "unspecified"):
    for handler in handlers.values():
        handler.abort_llm(reason=reason)


def wait_until_handlers_idle(timeout_sec: float = 30.0):
    start = time.time()
    while True:
        if all(handler.is_available for handler in handlers.values()):
            return

        if time.time() - start > timeout_sec:
            raise TimeoutError("Timed out while waiting for running inference to stop.")

        socketio.sleep(0.05)


def task_worker(model_id: str):
    global task_lists, task_locks, current_session_id, handlers

    logging.info("Task worker thread started.")

    while True:
        task = None
        with task_locks[model_id]:
            if handlers[model_id].is_available and task_lists[model_id]:
                task = task_lists[model_id].pop(0)

        if task:
            task_type = task["type"]
            task_value = task["value"]

            logging.info(f"[{model_id}] Processing task type: {task_type}")

            if task_type == "LLM":
                run_llm_generation(handlers[model_id], **task_value)

            with task_locks[model_id]:
                socketio.emit("tasks", (model_id, len(task_lists[model_id])), to=current_session_id)
        else:
            time.sleep(0.1)


def run_llm_generation(handler: LLMHandler, question: str):
    global current_session_id

    logging.info(f"[{handler.model_id}] LLM executing...")

    try:
        is_aborted = True

        socketio.emit("start", handler.model_id, to=current_session_id)

        def for_each_generated_token(new_token: str):
            socketio.emit("token", (handler.model_id, new_token), to=current_session_id)
            socketio.sleep(0)

        handler.reset_cache()
        is_aborted, _ = handler.generate_response(question, for_each_generated_token)

    finally:
        socketio.sleep(0)
        socketio.emit("end", (handler.model_id, is_aborted), to=current_session_id)
        logging.info(f"[{handler.model_id}] LLM executed")


def allow_current_sid_only(func):
    def decorated(*args, **kwargs):
        global current_session_id

        if current_session_id != request.sid:  # type: ignore
            logging.error(f"Event refused since its already using. Current: {current_session_id}, Incoming: {request.sid}")  # type: ignore
            return

        return func(*args, **kwargs)

    return decorated


@socketio.event
def connect():
    global current_session_id

    if current_session_id is not None:
        logging.warning(f"Session refused since its already using. Current: {current_session_id}, Incoming: {request.sid}")  # type: ignore
        return

    current_session_id = cast(str, request.sid)  # type: ignore
    emit_loading_state()
    socketio.emit("models", [handler.model_id for handler in handlers.values()], to=current_session_id)
    emit_prompt_config_state(False, "Prompt bundle is not synced yet.")
    logging.info(f"Session connected: {current_session_id}")


@socketio.event
def disconnect():
    global task_lists, task_locks, current_session_id, prompt_config_ready

    if current_session_id != request.sid:  # type: ignore
        logging.warning(f"Session disconnection doesn't affect since its not using. Current: {current_session_id}, Disconnected: {request.sid}")  # type: ignore
        return

    logging.info(f"Session disconnected: {current_session_id}")

    current_session_id = None
    prompt_config_ready = False
    abort_all_handlers(reason="disconnect")
    clear_all_queued_tasks()

    for handler in handlers.values():
        handler.reset_cache()


@allow_current_sid_only
@socketio.event
def prompt_config(prompt_config: dict):
    global prompt_config_ready

    if not isinstance(prompt_config, dict):
        socketio.emit("error", {"message": "Prompt config payload is invalid."}, to=current_session_id)
        return

    system_prompt = prompt_config.get("system_prompt", "")
    try:
        prompt_config_ready = False
        emit_prompt_config_state(False, "Applying prompt bundle...")
        abort_all_handlers(reason="prompt_config_update")
        clear_all_queued_tasks()
        wait_until_handlers_idle()

        for handler in handlers.values():
            handler.set_prompt_texts(system_prompt)
            handler.reset_cache()

        prompt_config_ready = True
        emit_prompt_config_state(True, None)
        socketio.emit("prompt_config_saved", to=current_session_id)
        logging.info("Prompt config updated for all handlers.")
    except Exception as exc:
        prompt_config_ready = False
        logging.error("Failed to update prompt config", exc_info=True)
        emit_prompt_config_state(False, str(exc))
        socketio.emit("error", {"message": f"Failed to apply prompt bundle: {exc}"}, to=current_session_id)


@allow_current_sid_only
@socketio.event
def ask(model_id: str, question: str, interrupt: bool = False):
    global task_lists, task_locks, current_session_id

    if prompt_config_ready == False:
        socketio.emit("error", {"message": "Prompt bundle is not ready yet."}, to=current_session_id)
        return

    if model_id not in handlers.keys():
        logging.error(f"[{model_id}] model_id {model_id} doesn't exist!")
        return

    if not question:
        logging.error(f"[{model_id}] question is empty! question: '{question}'")
        return

    logging.info(f"[{model_id}] LLM task enqueued")

    with task_locks[model_id]:
        if interrupt:
            cleared_count = len(task_lists[model_id])
            task_lists[model_id] = []

            if handlers[model_id].is_available == False:
                handlers[model_id].abort_llm(reason="socket_ask_interrupt")

        task_lists[model_id].append({"type": "LLM", "value": {"question": question}})
        socketio.emit("tasks", (model_id, len(task_lists[model_id])), to=current_session_id)


@allow_current_sid_only
@socketio.event
def abort(model_id: str):
    global current_session_id

    if model_id not in handlers.keys():
        logging.error(f"[{model_id}] model_id {model_id} doesn't exist!")
        return

    logging.info(f"[{model_id}] Abort signal received.")
    handlers[model_id].abort_llm(reason="socket_abort")

    with task_locks[model_id]:
        task_lists[model_id] = []
        socketio.emit("tasks", (model_id, 0), to=current_session_id)


@allow_current_sid_only
@socketio.event
def reset(model_id: str):
    global current_session_id

    if model_id not in handlers.keys():
        logging.error(f"[{model_id}] model_id {model_id} doesn't exist!")
        return

    with task_locks[model_id]:
        if handlers[model_id].is_available:
            handlers[model_id].reset_cache()
            socketio.emit("reset_done", to=current_session_id)
            logging.info(f"[{model_id}] Reset success.")
        else:
            socketio.emit("error", {"message": "Handler is busy, cannot reset now."}, to=current_session_id)
            logging.info(f"[{model_id}] Reset failed.")


for handler in handlers.values():
    socketio.start_background_task(task_worker, handler.model_id)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
