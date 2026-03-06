import { Grid2, Typography } from "@mui/material";
import { Fragment, MutableRefObject, useEffect, useRef } from "react";
import Answer from "./Answer";
import { LLMClient, LLMState } from "./type";

export default function Dialog({
  client,
  scrollGridRef,
  isDarkMode,
}: {
  client: LLMClient,
  scrollGridRef: MutableRefObject<HTMLDivElement | null>,
  isDarkMode: boolean,
}) {
  const isReasoningModel = [
    "LGAI-EXAONE/EXAONE-Deep-2.4B",
    "LGAI-EXAONE/EXAONE-Deep-7.8B",
    "Qwen/Qwen3-0.6B",
    "Qwen/Qwen3-1.7B",
    "Qwen/Qwen3-4B",
    "Qwen/Qwen3-8B",
  ].includes(client.model_id);

  const bottomDivRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomDivRef.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" })
  }

  useEffect(() => {
    if (scrollGridRef.current != null) {
      scrollToBottom();
    }
  }, [client.recentAnswer])

  useEffect(() => {
    scrollToBottom();
  }, [client.dialog.length])

  return (
    <Fragment>
      {client.dialog.map((qna, index) =>
        <Fragment key={`${index}`}>
          <Grid2 container justifyContent="flex-end">
            <Typography
              sx={{
                backgroundColor: isDarkMode ? "#F8F9FD12" : "#E9EFFB",
                padding: "20px",
                borderRadius: "12px",
                fontWeight: "regular",
                fontSize: "18px",
                lineHeight: "170%",
                letterSpacing: "-0.3px",
                color: isDarkMode ? "#FFFFFF" : "#212631",
                maxWidth: "270px",
              }}
            >
              {qna.question}
            </Typography>
          </Grid2>
          {!(client.state != LLMState.IDLE && index == client.dialog.length - 1) &&
            <Answer
              client={client}
              answer={qna.answer}
              isAnswering={false}
              isReasoningModel={isReasoningModel}
              isDarkMode={isDarkMode}
            />
          }
        </Fragment>
      )}
      {client.state != LLMState.IDLE &&
        <Answer
          client={client}
          answer={client.recentAnswer}
          isAnswering={true}
          isReasoningModel={isReasoningModel}
          isDarkMode={isDarkMode}
        />
      }
      <div ref={bottomDivRef}></div>
    </Fragment>
  );
}