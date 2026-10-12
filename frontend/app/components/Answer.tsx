import { CircularProgress, Typography } from '@mui/material';
import Grid2 from "@mui/material/Grid2"
import { Fragment } from 'react';
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from 'rehype-highlight'
import { LLMClient } from './type';
import ModelIcon from './ModelIcon';

export default function Answer({
  client,
  answer,
  isAnswering,
  isReasoningModel,
  isDarkMode,
}: {
  client: LLMClient,
  answer: string | null,
  isAnswering: boolean,
  isReasoningModel: boolean,
  isDarkMode: boolean,
}) {
  const thought_and_answer = !!answer && (isReasoningModel ? (answer.includes("<think>") ? answer.split("<think>")[1].split("</think>") : answer.split("</thought>")) : ["", answer]);
  const thought = thought_and_answer && thought_and_answer[0];
  const real_answer = thought_and_answer && thought_and_answer[1];

  return (
    <Grid2
      container
      columnSpacing="22px"
      direction="row"
      wrap="nowrap"
      alignItems={thought_and_answer ? "flex-start" : "center"}
    >
      <Grid2
        container
        justifyContent="center"
        alignItems="center"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "55px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #AAB8C2",
        }}
      >
        <ModelIcon
          model_id={client.model_id}
          width="22px"
        />
      </Grid2>
      <Grid2
        container
        size="grow"
        alignItems={thought_and_answer ? "flex-start" : "center"}
        sx={{
          fontFamily: "Pretendard",
          color: isDarkMode ? "#FFFFFF" : "#212631",
          fontSize: "18px",
          lineHeight: "170%",
          letterSpacing: "-0.3px",
          minWidth: 0,
          "& .llm-markdown": {
            width: "100%",
            minWidth: 0,
          },
          "& .llm-markdown > *:first-of-type": { marginTop: 0 },
          "& .llm-markdown > *:last-child": { marginBottom: 0 },
          "& .llm-markdown p": { margin: "0 0 12px" },
          "& .llm-markdown ul, & .llm-markdown ol": {
            margin: "0 0 12px",
            paddingLeft: "22px",
          },
          "& .llm-markdown li": { marginBottom: "4px" },
          "& .llm-markdown blockquote": {
            margin: "0 0 12px",
            padding: "8px 14px",
            borderLeft: `3px solid ${isDarkMode ? "#5D6B80" : "#C9D6EA"}`,
            backgroundColor: isDarkMode ? "#F8F9FD12" : "#F3F7FD",
            color: isDarkMode ? "#D5DCE8" : "#4A5565",
          },
          "& .llm-markdown pre": {
            margin: "0 0 12px",
            padding: "14px 16px",
            borderRadius: "12px",
            backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
            border: `1px solid ${isDarkMode ? "#3E4A5D" : "#D8E1F0"}`,
            overflowX: "auto",
          },
          "& .llm-markdown code": {
            fontFamily: "CascadiaCode",
            fontSize: "0.92em",
          },
          "& .llm-markdown :not(pre) > code": {
            padding: "2px 6px",
            borderRadius: "6px",
            backgroundColor: isDarkMode ? "#F8F9FD1F" : "#EEF3FB",
            color: isDarkMode ? "#DCEAFF" : "#1F4F8A",
          },
          "& .llm-markdown h1, & .llm-markdown h2, & .llm-markdown h3, & .llm-markdown h4": {
            margin: "18px 0 10px",
            lineHeight: 1.35,
          },
          "& .llm-markdown table": {
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "12px",
            fontSize: "0.95em",
          },
          "& .llm-markdown th, & .llm-markdown td": {
            border: `1px solid ${isDarkMode ? "#3E4A5D" : "#D8E1F0"}`,
            padding: "8px 10px",
            textAlign: "left",
          },
          "& .llm-markdown th": {
            backgroundColor: isDarkMode ? "#F8F9FD12" : "#F3F7FD",
          },
        }}
      >
      {thought_and_answer ?
        <Fragment>
        {thought &&
          <Grid2
            container
            direction="column"
            alignItems="flex-start"
            sx={{
              color: "#898E94",
              "& > *:first-of-type": { marginTop: 0 },
              "& > *:last-of-type": { marginBottom: 0 },
            }}
          >
            <ReactMarkdown
              className="llm-markdown"
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeHighlight, [rehypeKatex, { strict: "ignore" }]]}
            >
              {thought + (isAnswering && !!answer == false ? " ..." : "")}
            </ReactMarkdown>
          </Grid2>
        }{real_answer &&
          <Grid2
            container
            direction="column"
            alignItems="flex-start"
            sx={{
              "& > *:first-of-type": { marginTop: 0 },
              "& > *:last-of-type": { marginBottom: 0 },
            }}
          >
            <ReactMarkdown
              className="llm-markdown"
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeHighlight, [rehypeKatex, { strict: "ignore" }]]}
            >
              {real_answer + (isAnswering ? " ..." : "")}
            </ReactMarkdown>
          </Grid2>
        }
        </Fragment> :
      isAnswering ?
        <Grid2 container direction="row" wrap="nowrap" justifyContent={"flex-start"} alignItems="center">
          <CircularProgress size={38} />
        {client.tasksNum > 0 &&
          <Typography variant='caption'>
            Waiting for available device... ({client.tasksNum} {client.tasksNum == 1 ? "task" : "tasks"} waiting)
          </Typography>
        }
        </Grid2> :
        <Typography variant='caption' sx={{color: "#898E94"}}>[Aborted]</Typography>
      }
      </Grid2>
    </Grid2>
  );
}
