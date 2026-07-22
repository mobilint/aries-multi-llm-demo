import { Grid2 } from "@mui/material";
import { useEffect, useRef } from "react";
import { getLanguageTexts } from "../settings";
import ChatInput from "./ChatInput";
import { LLMClient, LLMState } from "./type";
import Dialog from "./Dialog";
import Greetings from "./Greetings";
import DemoTitle from "./DemoTitle";

export default function Main({
  client,
  modelCount,
  ask,
  abort,
}: {
  client: LLMClient,
  modelCount?: number,
  ask: (question: string) => void,
  abort: () => void,
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollGridRef = useRef<HTMLDivElement | null>(null);
  const texts = getLanguageTexts(client.language);
  
  useEffect(() => {
    if (client.state == LLMState.IDLE)
      inputRef.current?.focus();
  }, [client.state]);
  
  return (
    <Grid2
      container
      direction="column"
      alignItems="center"
      size="grow"
      sx={{
        backgroundColor: "#F8F9FD",
        padding: "50px 53px",
      }}
    >
      <Grid2
        container
        justifyContent={"flex-start"}
        sx={{
          width: "100%",
        }}
      >
        <DemoTitle color="#212631" />
      </Grid2>
      <Grid2
        container
        size="grow"
        direction="column"
        wrap="nowrap"
        justifyContent={client.dialog.length == 0 ? "center" : undefined}
        alignItems="stretch"
        rowSpacing="44px"
        sx={{
          width: "100%",
          maxWidth: "880px",
          overflowY: "scroll",
          margin: "50px 0px",
        }}
        ref={scrollGridRef}
      >
        {client.dialog.length == 0 ?
          <Greetings
            model_id={client.model_id}
            modelCount={modelCount}
            texts={texts}
          /> :
          <Dialog
            client={client}
            scrollGridRef={scrollGridRef}
            isDarkMode={false}
          />
        }
      </Grid2>
      <Grid2
        sx={{
          width: "100%",
          maxWidth: "880px",
          paddingBottom: "33px",
        }}
      >
        <ChatInput
          clients={[client]}
          placeholder={texts.inputPlaceholder}
          disabled={false}
          ask={ask}
          abort={abort}
        />
      </Grid2>
    </Grid2>
  );
}
