import { Grid2, Typography } from "@mui/material";
import { LLMClient, LLMState } from "./type";
import AutoPromptingClient from "./AutoPromptingClient";
import ChatInput from "./ChatInput";
import Image from "next/image";

export default function AutoPrompting({
  clients,
  currentModels,
  ask,
  abort,
  reset,
  setCurrentModels,
}: {
  clients: {[model_id: string]: LLMClient},
  currentModels: string[],
  ask: (model_id: string, question: string) => void,
  abort: (model_id: string) => void,
  reset: (model_id: string) => void,
  setCurrentModels: (updator: (models: string[]) => string[]) => void,
}) {
  const modelCount = Object.keys(clients).length;
  const mlaLabel = modelCount === 16 ? "MLA400" : modelCount === 4 ? "MLA100" : "???";

  const handleAsk = (question: string) => {
    Object.entries(clients).forEach(([model_id, client]) => {
      if (currentModels.length > 0 && currentModels.includes(model_id) == false)
        return;

      if (client.state != LLMState.IDLE)
        abort(model_id);

      reset(model_id);
      ask(model_id, question);
    });

    if (currentModels.length == 0)
      setCurrentModels(_ => Object.keys(clients));
  }

  const handleAbort = () => {
    Object.entries(clients).forEach(([model_id, client]) => {
      if (currentModels.length > 0 && currentModels.includes(model_id) == false)
        return;

      if (client.state != LLMState.IDLE) {
        abort(model_id);
      }
    });
  }

  const handleLabelClick = (model: string) => {
    setCurrentModels((models) => {
      if (models.includes(model)) {
        return models.filter((d) => d != model);
      } else {
        return [...models, model];
      }
    });
  }

  return (
    <Grid2
      container
      justifyContent={"center"}
      alignItems={"center"}
      direction="column"
      rowSpacing={"76px"}
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        padding: "80px 28px",
        backgroundColor: "#000000",
      }}
    >
      <Grid2
        container
        direction="row"
        wrap="nowrap"
        justifyContent="center"
        alignItems="center"
        columnSpacing={"12px"}
        sx={{
          position: "absolute",
          top: "26px",
          right: "27px",
          borderRadius: "30px",
          backgroundColor: "#212631",
          padding: "12px 22px",
        }}
      >
        <Grid2
          sx={{
            backgroundColor: "#DB3232",
            borderRadius: "50%",
            width: "14px",
            height: "14px",
          }}
        />
        <Typography
          sx={{
            color: "#FFFFFF",
            fontWeight: 500,
            fontSize: "24px",
            lineHeight: "130%",
            letterSpacing: "-0.2px",
            textAlign: "left",
            verticalAlign: "middle",
          }}
        >
          LIVE
        </Typography>
      </Grid2>
      <Grid2
        container
        justifyContent="center"
        alignContent="center"
        direction="row"
        wrap="nowrap"
        columnSpacing="60px"
      >
        <Grid2 container justifyContent="center" alignItems="center">
          <Image
            src="mobilint_ci.svg"
            alt="Mobilint CI Logo"
            width={281.56}
            height={77}
          />
        </Grid2>
        <Grid2
          container
          direction="column"
          rowSpacing={"14px"}
          alignItems="flex-start"
        >
          <Grid2
            container
            direction="row"
            wrap="nowrap"
            columnSpacing={"20px"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Typography
              sx={{
                backgroundColor: "#2362DB",
                borderRadius: "7px",
                padding: "5px 12px",
                color: "#FFFFFF",
                fontWeight: 500,
                fontSize: "30px",
                lineHeight: "130%",
                letterSpacing: "-0.3px",
                textAlign: "left",
                verticalAlign: "middle",
              }}
            >
              {mlaLabel}
            </Typography>
            <Typography
              sx={{
                color: "#FFFFFF",
                fontWeight: 500,
                fontSize: "48px",
                lineHeight: "130%",
                letterSpacing: "-0.3px",
                textAlign: "left",
                verticalAlign: "middle",
              }}
            >
              Multi-LLM Demo
            </Typography>
          </Grid2>
          <Typography
            sx={{
              color: "#FFFFFF",
              fontWeight: 400,
              fontSize: "24px",
              lineHeight: "130%",
              letterSpacing: "-0.3px",
              textAlign: "left",
              verticalAlign: "middle",
            }}
          >
            Click the model to continue the conversation!
          </Typography>
        </Grid2>
      </Grid2>
      <Grid2
        container
        size="grow"
        rowSpacing={"30px"}
        columnSpacing={"30px"}
        justifyContent={"center"}
        alignItems={"stretch"}
        sx={{
          width: "100%",
        }}
      >
      {Object.values(clients).map((client) =>
        <AutoPromptingClient
          key={client.model_id}
          size={3}
          client={client}
          isDarkMode={!currentModels.includes(client.model_id)}
          onLabelClick={() => handleLabelClick(client.model_id)}
        />
      )}
      </Grid2>
      <Grid2
        container
        sx={{
          width: "100%",
          maxWidth: "880px",
        }}
      >
        <ChatInput
          clients={Object.values(clients).filter((client) => currentModels.length == 0 || currentModels.includes(client.model_id))}
          ask={handleAsk}
          abort={handleAbort}
        />
      </Grid2>
    </Grid2>
  );
}
