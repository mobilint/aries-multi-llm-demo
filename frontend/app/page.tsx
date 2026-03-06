"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { defaultLLMClient, LLMClient, LLMState } from "./components/type";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AutoPrompting from "./components/AutoPrompting";
import { example_questions, INACTIVITY_TIMEOUT_MS } from "./settings";
import { useDebounce } from "react-simplikit";

const theme = createTheme({
  typography: {
    fontFamily: "Pretendard",
  },
});

export default function Home() {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [currentModels, setCurrentModels] = useState<string[]>([]);
  const [clients, setClients] = useState<{[model_id: string]: LLMClient}>({});
  const [exampleIndexes, setExampleIndexes] = useState<{[model_id: string]: number}>({});

  const debouncedSetCurrentModelsNull = useDebounce(() => setCurrentModels([]), INACTIVITY_TIMEOUT_MS);

  useEffect(() => {
    if (currentModels.length > 0)
      debouncedSetCurrentModelsNull();
  }, [currentModels]);

  const [isEscDown, setIsEscDown] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat) {
        if (e.code == "Esc" || e.code == "Escape" || e.key == "Esc" || e.key == "Escape") {
          setIsEscDown(true);
          e.preventDefault();
          return;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!e.repeat) {
        if (e.code == "Esc" || e.code == "Escape" || e.key == "Esc" || e.key == "Escape") {
          setIsEscDown(false);
          e.preventDefault();
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (isEscDown == true)
      setCurrentModels([]);
  }, [isEscDown])

  useEffect(() => {
    for (let model_id in clients) {
      const client = clients[model_id];

      if (currentModels.includes(model_id))
        continue;

      if (client.state == LLMState.IDLE) {
        console.log(model_id, currentModels);
        setExampleIndexes((cur) => {
          let copied = {...cur};
          copied[model_id] = (copied[model_id] + 1) % example_questions[client.model_id].length;
          return copied;
        });
        reset(client.model_id);
        ask(client.model_id, example_questions[client.model_id][exampleIndexes[model_id]]);
      }
    }
  }, [currentModels, clients]);

  function onConnect() {
    setIsConnected(true);
    setCurrentModels([]);
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  function onModels(models: string[]) {
    console.log("models", models);
    setModels(models);
    setExampleIndexes(Object.fromEntries(
      models.map((model) => [model, 0])
    ));
    setClients(Object.fromEntries(
      models.map((model) => [model, {...defaultLLMClient, model_id: model}])
    ));
  }

  function onTasks(model_id: string, tasks: number) {
    setClients((clients) => {
      let newClients = JSON.parse(JSON.stringify(clients));
      newClients[model_id].tasksNum = tasks;
      return newClients;
    });
  }

  function onStart(model_id: string) {
    console.log("start", model_id);

    setClients((clients) => {
      let newClients = JSON.parse(JSON.stringify(clients));
      newClients[model_id].state = LLMState.ANSWERING;
      return newClients;
    });
  }

  function onToken(model_id: string, token: string) {
    if (model_id in currentModels)
      debouncedSetCurrentModelsNull();
    
    setClients((clients) => {
      let newClients = JSON.parse(JSON.stringify(clients));

      if (clients[model_id].state != LLMState.ANSWERING)
        return newClients;
      
      if (clients[model_id].dialog.length == 0)
        return newClients;
      
      let old = newClients[model_id].recentAnswer;
      newClients[model_id].recentAnswer = old == null ? token : old + token;
      return newClients;
    });
  }

  function onEnd(model_id: string, isAborted: boolean) {
    console.log("end", model_id, isAborted);

    setClients((clients) => {
      let newClients = JSON.parse(JSON.stringify(clients));

      if (clients[model_id].state == LLMState.IDLE)
        return newClients;

      // Prevent aborted end comes after asking
      if (clients[model_id].state != LLMState.ABORTING && isAborted == true) {
        newClients[model_id].recentAnswer = null;
        return newClients;
      }

      newClients[model_id].state = LLMState.IDLE;
      
      if (clients[model_id].dialog.length == 0)
        return newClients;

      let newDialog = [...clients[model_id].dialog];
      newDialog[newDialog.length - 1].answer = clients[model_id].recentAnswer + (isAborted ? " [ABORTED]" : "");
      newClients[model_id].dialog = newDialog;

      newClients[model_id].recentAnswer = null;

      return newClients;
    });
  }

  useEffect(() => {
    socket.current = io(`${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:5000`);
    socket.current.on('connect', onConnect);
    socket.current.on('disconnect', onDisconnect);
    socket.current.on('models', onModels);
    socket.current.on('tasks', onTasks);
    socket.current.on('start', onStart);
    socket.current.on('token', onToken);
    socket.current.on('end', onEnd);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current.off('connect', onConnect);
        socket.current.off('disconnect', onDisconnect);
        socket.current.off('models', onModels);
        socket.current.off('tasks', onTasks);
        socket.current.off('start', onStart);
        socket.current.off('token', onToken);
        socket.current.off('end', onEnd);
      }
    };
  }, []);

  function ask(model_id: string, new_question: string) {
    if (socket.current && new_question != "") {
      setClients((clients) => {
        let newClients = JSON.parse(JSON.stringify(clients));

        let newDialog = [...clients[model_id].dialog];
        newDialog.push({ question: new_question, answer: null });
        newClients[model_id].dialog = newDialog;

        newClients[model_id].state = LLMState.ASKING;
        newClients[model_id].question = "";

        return newClients;
      });
      
      socket.current.emit("ask", model_id, new_question);
    }
  }

  function abort(model_id: string) {
    if (socket.current) {
      setClients((clients) => {
        let newClients = JSON.parse(JSON.stringify(clients));
        newClients[model_id].state = LLMState.ABORTING;

        return newClients;
      });

      socket.current.emit("abort", model_id);
    }
  }

  function reset(model_id: string) {
    if (socket.current) {
      console.log("reset", model_id);

      setClients((clients) => {
        let newClients = JSON.parse(JSON.stringify(clients));
        newClients[model_id].dialog = [];
        newClients[model_id].recentAnswer = null;
        return newClients;
      });

      // socket.current.emit("reset", dev_no);
    }
  }
  
  if (isConnected == false)
    return undefined;

  return (
    <ThemeProvider theme={theme}>
      <AutoPrompting
        clients={clients}
        ask={ask}
        abort={abort}
        reset={reset}
        currentModels={currentModels}
        setCurrentModels={setCurrentModels}
      />
    </ThemeProvider>
  );
}
