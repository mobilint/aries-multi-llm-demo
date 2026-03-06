import logging
import torch
import re
import copy
import numpy as np

from time import time
from transformers.generation.streamers import TextIteratorStreamer
from transformers.generation.configuration_utils import GenerationConfig
from typing import List, Optional, Callable, Any
from threading import Thread, Event
from transformers import AutoTokenizer, AutoModelForCausalLM
from mblt_model_zoo.hf_transformers.utils.cache_utils import MobilintCache
from qbruntime import Accelerator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class StopOnSignalTextIteratorStreamer(TextIteratorStreamer):
    def __init__(self, tokenizer, stop_event, **kwargs):
        super().__init__(tokenizer, **kwargs)
        self.stop_event = stop_event

    def put(self, value):
        if self.stop_event.is_set():
            self.end_of_stream = True
            raise StopIteration()
        super().put(value)


class LLMHandler:
    def __init__(
        self,
        model_id: str = "meta-llama/Llama-3.2-3B-Instruct",
        dev_no: int = 0,
        target_cores: List[str] = [],
        system_prompt_path: str = "src/prompts/en-system.txt",
        inter_prompt_path: str = "src/prompts/en-inter-prompt.txt",
        generation_config_path: str = "src/generation_configs/Llama-3.2-3B-Instruct/"
    ):
        start = time()
        
        self.model_id = model_id
        self.dev_no = dev_no
        self.target_cores = target_cores
        self.system_prompt_path = system_prompt_path
        self.inter_prompt_path = inter_prompt_path
        self.generation_config_path = generation_config_path
        
        self.is_available = True
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Initializing...")
        
        self.conversation = []
        self.abort_flag = Event()
        self.stop_event = Event()
        
        self.system_text: Optional[str] = None
        self._select_device()
        self._load_model()
        self._load_txt_files()

        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] >>> Initialized {self.model_id} model with /dev/aries{self.dev_no} <<<")
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Initialization completed in {time() - start:.2f} sec")
    
    def _select_device(self) -> None:
        gpu_available = torch.cuda.is_available()
        npu_available = False
        try:
            acc = Accelerator()
            del acc
            npu_available = True
        except:
            pass

        logging.info(f'[aries{self.dev_no}] GPU: {"O" if gpu_available else "X"}, NPU: {"O" if npu_available else "X"}')
        
        if gpu_available == False and npu_available == False:
            raise SystemError("No AI Accelerator Found!")
        
        self.is_npu = npu_available
        self.device = "cpu" if self.is_npu else "cuda"
        
    def _get_model_id(self, model_id: str):
        if self.is_npu:
            return re.sub(r"^[^/]+", "mobilint", model_id)
        else:
            return model_id
            
    def _load_txt_files(self):
        before = self.system_text
        self.system_text = open(self.system_prompt_path, "r", encoding="UTF-8").read()
        self.inter_prompt_text = open(self.inter_prompt_path, encoding="UTF-8").read()
        self.base_conversation = [{"role": "system", "content": self.system_text}] if self.system_text != "" else []
        
        if before != self.system_text:
            self._prefill_cache()

    def _load_model(self):
        start = time()
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Loading model: {self.model_id}")
        
        converted_model_id = self._get_model_id(self.model_id)
        self.tokenizer = AutoTokenizer.from_pretrained(
            converted_model_id,
            trust_remote_code=True
        )
        if self.is_npu:
            self.model = AutoModelForCausalLM.from_pretrained(
                converted_model_id,
                trust_remote_code=True,
                dev_no=self.dev_no,
                target_cores=self.target_cores,
            ).to(self.device)
        else:
            self.model = AutoModelForCausalLM.from_pretrained(
                converted_model_id,
                trust_remote_code=True
            ).to(self.device)
        
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Load completed in {time() - start:.2f} sec")

    def _prefill_cache(self):
        start = time()
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Prefill model: {self.model_id}")
        
        self.initial_cache: Optional[Any] = None
        self.initial_past_token_ids = np.array([[]])
        
        if len(self.base_conversation) > 0:
            prompt = self.tokenizer.apply_chat_template(self.base_conversation, tokenize=False, add_generation_prompt=False)
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
            
            output = self.model.generate(
                **inputs,
                max_new_tokens=1,
                use_cache=True,
                past_key_values=None,
                return_dict_in_generate=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )
            self.initial_past_token_ids = output.sequences.detach().cpu().numpy()
            if hasattr(output, "past_key_values"):
                self.initial_cache = output.past_key_values
            
            if isinstance(self.initial_cache, MobilintCache):
                self.initial_cache.dump_cache_memory()
                self.past_key_values = self.initial_cache.copy()
            else:
                self.past_key_values = copy.deepcopy(self.initial_cache)
        else:
            logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] No prompts to prefill!")
            self.past_key_values = None
        
        seq_length = self.initial_cache.get_seq_length() if self.initial_cache is not None else 0
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Prefill completed in {time() - start:.2f} sec, seq_length: {seq_length}")
        
    def reset_cache(self):
        seq_length = self.initial_cache.get_seq_length() if self.initial_cache is not None else 0
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Reset cache for model: {self.model_id}, seq_length: {seq_length}")
        self._load_txt_files()
        
        self.conversation = self.base_conversation.copy()
        if hasattr(self, "past_key_values"):
            del self.past_key_values
                
        if isinstance(self.initial_cache, MobilintCache):
            self.past_key_values = self.initial_cache.copy()
            self.past_key_values.load_cache_memory()
        else:
            self.past_key_values = copy.deepcopy(self.initial_cache)
        
        self.past_token_ids = self.initial_past_token_ids.copy()

    def abort_llm(self):
        logging.info(f"[aries{self.dev_no} {self.target_cores[0]}] Abort signal set for model: {self.model_id}")
        self.abort_flag.set()

    def generate_response(
        self, prompt: str, forEachGeneratedToken: Optional[Callable[[str], None]] = None
    ) -> tuple[bool, str]:
        if self.is_available == False:
            logging.error(f"[aries{self.dev_no} {self.target_cores[0]}] generate_response is called when model is busy!")
            return False, ""
        
        self.is_available = False

        answer = ""
        is_aborted = False

        try:
            self.abort_flag.clear()
            self.stop_event.clear()

            user_prompt = self.conversation + [{"role": "user", "content": prompt}]
            inter_prompt_disabled = [
                "LGAI-EXAONE/EXAONE-Deep-2.4B",
                "LGAI-EXAONE/EXAONE-Deep-7.8B",
            ]
            if self.inter_prompt_text != "" and self.model_id not in inter_prompt_disabled:
                user_prompt += [{"role": "system", "content": self.inter_prompt_text}]

            prompt_text = self.tokenizer.apply_chat_template(user_prompt, tokenize=False, add_generation_prompt=True)
            inputs = self.tokenizer(prompt_text, return_tensors="pt").to(self.device)
            streamer = StopOnSignalTextIteratorStreamer(
                self.tokenizer,
                self.stop_event,
                skip_prompt=True,
                skip_special_tokens=True,
            )

            def generation_wrapper(**kwargs):
                try:
                    handler = kwargs.pop("handler")
                    output = self.model.generate(**kwargs, pad_token_id=self.tokenizer.eos_token_id)
                    handler.past_token_ids = output.sequences.detach().cpu().numpy()
                    if hasattr(output, "past_key_values"):
                        handler.past_key_values = output.past_key_values
                except StopIteration:
                    pass
                except Exception as e:
                    logging.error(f"[aries{self.dev_no} {self.target_cores[0]}] Exception in generation thread: {e}", exc_info=True)
                    streamer.end()

            generation_config = GenerationConfig.from_pretrained(self.generation_config_path)
            
            input_ids = inputs["input_ids"].detach().cpu().numpy()
            if self.past_key_values is not None:
                for i in range(len(self.past_token_ids[0])):
                    if input_ids[0][i] != self.past_token_ids[0][i]:
                        if self.past_key_values.get_seq_length() != i - 1:
                            logging.info(f"Set seq_length from {self.past_key_values.get_seq_length()} to {i - 1} due to token ids mismatch")
                        self.past_key_values.layers[0]._seen_tokens = i - 1
                        break
                        
            generation_kwargs = dict(
                generation_config=generation_config,
                **inputs,
                streamer=streamer,
                max_length=4096,
                use_cache=True,
                past_key_values=self.past_key_values,
                return_dict_in_generate=True,
                handler=self,                
            )
            thread = Thread(target=generation_wrapper, kwargs=generation_kwargs)
            thread.start()

            for new_token in streamer:
                if self.abort_flag.is_set():
                    self.stop_event.set()
                    break
                answer += new_token
                if forEachGeneratedToken:
                    forEachGeneratedToken(new_token)

            thread.join()
                        
            is_aborted = self.abort_flag.is_set()
            self.conversation = user_prompt + [{"role": "assistant", "content": answer}]

            return is_aborted, answer

        except Exception as e:
            logging.error(f"[aries{self.dev_no} {self.target_cores[0]}] Error while generating response: {e}", exc_info=True)
            return True, answer

        finally:
            self.is_available = True
