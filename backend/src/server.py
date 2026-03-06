import time
import logging
import json
from typing import Optional, cast
from flask import Flask, request
from flask_socketio import SocketIO
from threading import Lock
from pipeline_handler import LLMHandler
from qbruntime import Accelerator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

with open("src/models.json", "r") as f:
    models = json.load(f)

is_mla_400 = True

try:
    for i in range(4):
        acc = Accelerator(dev_no=i)
        del acc
except:
    is_mla_400 = False

if is_mla_400 == False:
    models = models[:4]

model_ids = [model["model_id"] for model in models]
assert len(model_ids) == len(set(model_ids)), "Model IDs are not unique!"

handlers = {model["model_id"]: LLMHandler(**model) for model in models}

task_lists = {handler.model_id: [] for handler in handlers.values()}
task_locks = {handler.model_id: Lock() for handler in handlers.values()}

current_session_id: Optional[str] = None


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

        def forEachGeneratedToken(new_token: str):
            socketio.emit("token", (handler.model_id, new_token), to=current_session_id)
            socketio.sleep(0)
        
        handler.reset_cache()
        is_aborted, _ = handler.generate_response(question, forEachGeneratedToken)

    finally:
        socketio.sleep(0)
        socketio.emit("end", (handler.model_id, is_aborted), to=current_session_id)
        logging.info(f"[{handler.model_id}] LLM executed")


def allow_current_sid_only(func):
    def decorated():
        global current_session_id
        
        if current_session_id != request.sid: # type: ignore
            logging.error(f"Event refused since its already using. Current: {current_session_id}, Incoming: {request.sid}") # type: ignore
            return
        
        func()
    
    return decorated


@socketio.event
def connect():
    global current_session_id
    
    if current_session_id is not None:
        logging.warning(f"Session refused since its already using. Current: {current_session_id}, Incoming: {request.sid}") # type: ignore
        return
    
    current_session_id = cast(str, request.sid) # type: ignore
    socketio.emit("models", [handler.model_id for handler in handlers.values()], to=current_session_id)
    logging.info(f"Session connected: {current_session_id}")


@socketio.event
def disconnect():
    global task_lists, task_locks, current_session_id
    
    if current_session_id != request.sid: # type: ignore
        logging.warning(f"Session disconnection doesn't affect since its not using. Current: {current_session_id}, Disconnected: {request.sid}") # type: ignore
        return
    
    logging.info(f"Session disconnected: {current_session_id}")
    
    current_session_id = None

    for handler in handlers.values():
        handler.abort_llm()
        
        with task_locks[handler.model_id]:
            task_lists[handler.model_id] = []
            
        handler.reset_cache()
        

@allow_current_sid_only
@socketio.event
def ask(model_id: str, question: str):
    global task_lists, task_locks, current_session_id
    
    if model_id not in handlers.keys():
        logging.error(f"[{model_id}] model_id {model_id} doesn't exist!")
        return

    if not question:
        logging.error(f"[{model_id}] question is empty! question: '{question}'")
        return
    
    logging.info(f"[{model_id}] LLM task enqueued")

    with task_locks[model_id]:
        task_lists[model_id].append({"type": "LLM", "value": {"question": question}})
        socketio.emit("tasks", (model_id, len(task_lists[model_id])), to=current_session_id)


@allow_current_sid_only
@socketio.event
def abort(model_id: str):
    global task_lists, task_locks, current_session_id

    if model_id not in handlers.keys():
        logging.error(f"[{model_id}] model_id {model_id} doesn't exist!")
        return
    
    logging.info(f"[{model_id}] Abort signal received.")
    
    handlers[model_id].abort_llm()


@allow_current_sid_only
@socketio.event
def reset(model_id: str):
    global task_lists, task_locks, current_session_id
    
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
