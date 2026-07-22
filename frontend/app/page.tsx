"use client";

import { useEffect, useRef, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import io, { Socket } from "socket.io-client";
import { useDebounce } from "react-simplikit";
import AutoPrompting from "./components/AutoPrompting";
import { defaultLLMClient, LLMClient, LLMState } from "./components/type";
import { DEFAULT_LANGUAGE, example_questions_by_language, getLanguageTexts, INACTIVITY_TIMEOUT_MS, loadPromptBundle } from "./settings";

const theme = createTheme({
  typography: {
    fontFamily: "Pretendard",
  },
});

export default function Home() {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    is_loading: false,
    is_ready: true,
    error: null as string | null,
  });
  const [currentModels, setCurrentModels] = useState<string[]>([]);
  const [clients, setClients] = useState<{[model_id: string]: LLMClient}>({});
  const [exampleIndexes, setExampleIndexes] = useState<{[model_id: string]: number}>({});
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [isPromptConfigReady, setIsPromptConfigReady] = useState(false);
  const [promptStatusMessage, setPromptStatusMessage] = useState<string | null>(null);
  const texts = getLanguageTexts(language);

  const debouncedSetCurrentModelsNull = useDebounce(() => setCurrentModels([]), INACTIVITY_TIMEOUT_MS);

  useEffect(() => {
    if (currentModels.length > 0)
      debouncedSetCurrentModelsNull();
  }, [currentModels, debouncedSetCurrentModelsNull]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat && ["Esc", "Escape"].includes(event.code || event.key)) {
        setCurrentModels([]);
        event.preventDefault();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!event.repeat && ["Esc", "Escape"].includes(event.code || event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  function onConnect() {
    setIsConnected(true);
    setCurrentModels([]);
    setIsPromptConfigReady(false);
    setPromptStatusMessage(null);
  }

  function onDisconnect() {
    setIsConnected(false);
    setBackendStatus({
      is_loading: false,
      is_ready: true,
      error: null,
    });
    setIsPromptConfigReady(false);
    setPromptStatusMessage(null);
  }

  function onLoadingState(loadingState: { is_loading: boolean, is_ready: boolean, error: string | null }) {
    setBackendStatus(loadingState);
  }

  function onModels(models: string[]) {
    setExampleIndexes(Object.fromEntries(
      models.map((model) => [model, 0]),
    ));
    setClients(Object.fromEntries(
      models.map((model) => [model, {...defaultLLMClient, model_id: model, language}]),
    ));
  }

  function onTasks(model_id: string, tasks: number) {
    setClients((current) => {
      const nextClients = JSON.parse(JSON.stringify(current));
      nextClients[model_id].tasksNum = tasks;
      return nextClients;
    });
  }

  function onStart(model_id: string) {
    setClients((current) => {
      const nextClients = JSON.parse(JSON.stringify(current));
      if (nextClients[model_id].state != LLMState.APPLYING_LANGUAGE)
        nextClients[model_id].state = LLMState.ANSWERING;
      return nextClients;
    });
  }

  function onToken(model_id: string, token: string) {
    if (currentModels.includes(model_id))
      debouncedSetCurrentModelsNull();

    setClients((current) => {
      const nextClients = JSON.parse(JSON.stringify(current));

      if (current[model_id].state != LLMState.ANSWERING)
        return nextClients;

      if (current[model_id].dialog.length == 0)
        return nextClients;

      const oldAnswer = nextClients[model_id].recentAnswer;
      nextClients[model_id].recentAnswer = oldAnswer == null ? token : oldAnswer + token;
      return nextClients;
    });
  }

  function onEnd(model_id: string, isAborted: boolean) {
    setClients((current) => {
      const nextClients = JSON.parse(JSON.stringify(current));

      if (current[model_id].state == LLMState.IDLE)
        return nextClients;

      if (current[model_id].state == LLMState.APPLYING_LANGUAGE) {
        nextClients[model_id].recentAnswer = null;
        nextClients[model_id].tasksNum = 0;
        return nextClients;
      }

      if (current[model_id].state != LLMState.ABORTING && isAborted) {
        nextClients[model_id].recentAnswer = null;
        return nextClients;
      }

      nextClients[model_id].state = LLMState.IDLE;

      if (current[model_id].dialog.length == 0)
        return nextClients;

      const nextDialog = [...current[model_id].dialog];
      nextDialog[nextDialog.length - 1].answer = current[model_id].recentAnswer + (isAborted ? " [ABORTED]" : "");
      nextClients[model_id].dialog = nextDialog;
      nextClients[model_id].recentAnswer = null;
      return nextClients;
    });
  }

  function onPromptConfigSaved() {
    setIsPromptConfigReady(true);
    setPromptStatusMessage(null);
    setClients((current) => Object.fromEntries(
      Object.entries(current).map(([model_id, client]) => [
        model_id,
        {
          ...client,
          state: client.state == LLMState.APPLYING_LANGUAGE ? LLMState.IDLE : client.state,
          tasksNum: client.state == LLMState.APPLYING_LANGUAGE ? 0 : client.tasksNum,
        },
      ]),
    ));
  }

  function onPromptConfigState(payload: { is_ready: boolean, message: string | null }) {
    setIsPromptConfigReady(payload.is_ready);
    setPromptStatusMessage(payload.message);
  }

  useEffect(() => {
    socket.current = io(`${window.location.protocol == "https:" ? "wss" : "ws"}://${window.location.hostname}:5000`);
    socket.current.on("connect", onConnect);
    socket.current.on("disconnect", onDisconnect);
    socket.current.on("loading_state", onLoadingState);
    socket.current.on("models", onModels);
    socket.current.on("tasks", onTasks);
    socket.current.on("start", onStart);
    socket.current.on("token", onToken);
    socket.current.on("end", onEnd);
    socket.current.on("prompt_config_saved", onPromptConfigSaved);
    socket.current.on("prompt_config_state", onPromptConfigState);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current.off("connect", onConnect);
        socket.current.off("disconnect", onDisconnect);
        socket.current.off("loading_state", onLoadingState);
        socket.current.off("models", onModels);
        socket.current.off("tasks", onTasks);
        socket.current.off("start", onStart);
        socket.current.off("token", onToken);
        socket.current.off("end", onEnd);
        socket.current.off("prompt_config_saved", onPromptConfigSaved);
        socket.current.off("prompt_config_state", onPromptConfigState);
      }
    };
  }, []);

  useEffect(() => {
    async function syncPromptBundle() {
      if (socket.current == null || isConnected == false)
        return;

      setIsPromptConfigReady(false);
      const promptBundle = await loadPromptBundle(language);
      socket.current.emit("prompt_config", promptBundle);
    }

    syncPromptBundle();
  }, [isConnected, language]);

  function ask(model_id: string, new_question: string, interrupt = false) {
    if (socket.current == null || new_question.trim() == "" || isPromptConfigReady == false)
      return;

    setClients((current) => {
      const nextClients = JSON.parse(JSON.stringify(current));
      const nextDialog = [...current[model_id].dialog];
      nextDialog.push({ question: new_question, answer: null });
      nextClients[model_id].dialog = nextDialog;
      nextClients[model_id].state = LLMState.ASKING;
      return nextClients;
    });

    socket.current.emit("ask", model_id, new_question, interrupt);
  }

  function abort(model_id: string) {
    if (socket.current == null)
      return;

    setClients((current) => {
      const nextClients = JSON.parse(JSON.stringify(current));
      nextClients[model_id].state = LLMState.ABORTING;
      return nextClients;
    });

    socket.current.emit("abort", model_id);
  }

  function reset(model_id: string) {
    if (socket.current == null)
      return;

    setClients((current) => {
      const nextClients = JSON.parse(JSON.stringify(current));
      nextClients[model_id].dialog = [];
      nextClients[model_id].recentAnswer = null;
      return nextClients;
    });
  }

  useEffect(() => {
    Object.entries(clients).forEach(([model_id, client]) => {
      if (currentModels.includes(model_id))
        return;

      if (client.state != LLMState.IDLE)
        return;

      if (isPromptConfigReady == false)
        return;

      const questions = example_questions_by_language[language]?.[client.model_id] ?? [];
      if (questions.length == 0)
        return;

      const exampleIndex = exampleIndexes[model_id] ?? 0;
      setExampleIndexes((current) => ({
        ...current,
        [model_id]: (exampleIndex + 1) % questions.length,
      }));
      reset(client.model_id);
      ask(client.model_id, questions[exampleIndex]);
    });
  }, [ask, clients, currentModels, exampleIndexes, isPromptConfigReady, language, reset]);

  function changeLanguage(nextLanguage: string) {
    if (nextLanguage == language)
      return;

    if (socket.current) {
      Object.entries(clients).forEach(([model_id, client]) => {
        if (client.state != LLMState.IDLE)
          socket.current?.emit("abort", model_id);
      });
    }

    setIsPromptConfigReady(false);
    setLanguage(nextLanguage);
    setExampleIndexes((current) => Object.fromEntries(
      Object.keys(current).map((model) => [model, 0]),
    ));
    setClients((current) => Object.fromEntries(
      Object.entries(current).map(([model_id, client]) => [
        model_id,
        {
          ...client,
          language: nextLanguage,
          state: LLMState.APPLYING_LANGUAGE,
          tasksNum: 0,
          recentAnswer: null,
        },
      ]),
    ));
    setCurrentModels([]);
  }

  if (isConnected == false)
    return undefined;

  const isReady = isConnected && backendStatus.is_ready && isPromptConfigReady;
  let statusMessage = texts.statusConnecting;

  if (backendStatus.error != null)
    statusMessage = backendStatus.error;
  else if (backendStatus.is_loading)
    statusMessage = texts.statusLoadingModels;
  else if (promptStatusMessage != null)
    statusMessage = promptStatusMessage;
  else if (isPromptConfigReady == false)
    statusMessage = texts.statusPreparingPromptBundle;

  return (
    <ThemeProvider theme={theme}>
      <AutoPrompting
        clients={clients}
        currentModels={currentModels}
        currentLanguage={language}
        texts={texts}
        isReady={isReady}
        statusMessage={statusMessage}
        ask={ask}
        abort={abort}
        reset={reset}
        changeLanguage={changeLanguage}
        setCurrentModels={setCurrentModels}
      />
    </ThemeProvider>
  );
}
