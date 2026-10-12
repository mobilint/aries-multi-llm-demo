export type QNA = {
  question: string,
  answer: null | string,
};

export type DialogType = QNA[];

export enum LLMState {
  IDLE,
  ASKING,
  ANSWERING,
  ABORTING,
  APPLYING_LANGUAGE,
};

export type LLMClient = {
  model_id: string,
  language: string,
  tasksNum: number,
  state: LLMState,
  dialog: DialogType,
  recentAnswer: string | null,
};

export const defaultLLMClient: LLMClient = {
  model_id: "",
  language: "en",
  tasksNum: 0,
  state: LLMState.IDLE,
  dialog: [],
  recentAnswer: null,
};
