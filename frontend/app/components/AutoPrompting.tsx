import { CircularProgress, Grid2, Typography } from "@mui/material";
import Image from "next/image";
import { AVAILABLE_LANGUAGES, LanguageText } from "../settings";
import AutoPromptingClient from "./AutoPromptingClient";
import ChatInput from "./ChatInput";
import LanguageSwitcher from "./LanguageSwitcher";
import { LLMClient, LLMState } from "./type";

export default function AutoPrompting({
  clients,
  currentModels,
  currentLanguage,
  texts,
  isReady,
  statusMessage,
  ask,
  abort,
  reset,
  changeLanguage,
  setCurrentModels,
}: {
  clients: {[model_id: string]: LLMClient},
  currentModels: string[],
  currentLanguage: string,
  texts: LanguageText,
  isReady: boolean,
  statusMessage: string,
  ask: (model_id: string, question: string, interrupt?: boolean) => void,
  abort: (model_id: string) => void,
  reset: (model_id: string) => void,
  changeLanguage: (language: string) => void,
  setCurrentModels: (updator: (models: string[]) => string[]) => void,
}) {
  const showLoadingOverlay = isReady == false;

  const handleAsk = (question: string) => {
    if (isReady == false || question.trim() == "")
      return;

    Object.entries(clients).forEach(([model_id, client]) => {
      if (currentModels.length > 0 && currentModels.includes(model_id) == false)
        return;

      reset(model_id);
      ask(model_id, question, client.state != LLMState.IDLE);
    });

    if (currentModels.length == 0)
      setCurrentModels(() => Object.keys(clients));
  };

  const handleAbort = () => {
    Object.entries(clients).forEach(([model_id, client]) => {
      if (currentModels.length > 0 && currentModels.includes(model_id) == false)
        return;

      if (client.state != LLMState.IDLE)
        abort(model_id);
    });
  };

  const handleLabelClick = (model: string) => {
    setCurrentModels((models) => {
      if (models.includes(model))
        return models.filter((selectedModel) => selectedModel != model);

      return [...models, model];
    });
  };

  return (
    <Grid2
      container
      justifyContent="center"
      alignItems="center"
      direction="column"
      rowSpacing="76px"
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
        columnSpacing="12px"
        sx={{
          position: "absolute",
          top: "26px",
          right: "27px",
        }}
      >
        <LanguageSwitcher
          languages={[...AVAILABLE_LANGUAGES]}
          currentLanguage={currentLanguage}
          disabled={showLoadingOverlay}
          changeLanguage={changeLanguage}
        />
        <Grid2
          container
          direction="row"
          wrap="nowrap"
          alignItems="center"
          columnSpacing="14px"
          sx={{
            borderRadius: "30px",
            backgroundColor: "#222222",
            padding: "14px 27px",
          }}
        >
          <Grid2
            sx={{
              backgroundColor: "#DB3232",
              borderRadius: "14px",
              width: "14px",
              height: "14px",
            }}
          />
          <Typography
            sx={{
              color: "#DEDEDE",
              fontWeight: 600,
              fontSize: "20px",
              lineHeight: "130%",
              letterSpacing: "-0.2px",
              textAlign: "left",
              verticalAlign: "middle",
            }}
          >
            Live
          </Typography>
        </Grid2>
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
            width={282}
            height={77}
          />
        </Grid2>
        <Grid2
          container
          direction="column"
          rowSpacing="14px"
          alignItems="flex-start"
        >
          <Typography
            sx={{
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "48px",
              lineHeight: "130%",
              letterSpacing: "-0.2px",
              textAlign: "left",
              verticalAlign: "middle",
            }}
          >
            Multi-LLM Powered by ARIES
          </Typography>
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
            {texts.sidebarTitle}
          </Typography>
          {showLoadingOverlay &&
            <Typography
              sx={{
                color: "#FFFFFFB2",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "150%",
                letterSpacing: "-0.2px",
                textAlign: "left",
              }}
            >
              {statusMessage}
            </Typography>
          }
        </Grid2>
      </Grid2>
      <Grid2
        container
        size="grow"
        rowSpacing="30px"
        columnSpacing="30px"
        justifyContent="center"
        alignItems="stretch"
        sx={{
          width: "100%",
          position: "relative",
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
        {showLoadingOverlay &&
          <Grid2
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
            rowSpacing="18px"
            sx={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(8, 13, 22, 0.78)",
              backdropFilter: "blur(10px)",
              borderRadius: "24px",
              zIndex: 2,
              padding: "32px",
            }}
          >
            <CircularProgress
              size={40}
              thickness={4}
              sx={{
                color: "#FFFFFF",
              }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "34px",
                lineHeight: "130%",
                letterSpacing: "-0.3px",
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              {texts.loadingPreparingModels}
            </Typography>
            <Typography
              sx={{
                maxWidth: "620px",
                fontWeight: 400,
                fontSize: "20px",
                lineHeight: "160%",
                letterSpacing: "-0.3px",
                color: "#D5DCE8",
                textAlign: "center",
              }}
            >
              {statusMessage}
            </Typography>
          </Grid2>
        }
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
          placeholder={texts.inputPlaceholder}
          disabled={isReady == false}
          ask={handleAsk}
          abort={handleAbort}
        />
      </Grid2>
    </Grid2>
  );
}
