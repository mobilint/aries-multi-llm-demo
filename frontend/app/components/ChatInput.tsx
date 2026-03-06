import { FormControl, Input, IconButton, Grid2 } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { LLMClient, LLMState } from "./type";
import { Stop, ArrowUpward } from "@mui/icons-material";

export default function ChatInput({
  clients,
  ask,
  abort,
}: {
  clients: LLMClient[],
  ask: (question: string) => void,
  abort: () => void,
}) {
  const [value, setValue] = useState<string>("");
  const isNotIdle = clients.some(client => client.state != LLMState.IDLE);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!isNotIdle)
      inputRef.current?.focus();
  }, [isNotIdle]);

  const handleClick = () => {
    ask(value);
    setValue("");
  }

  return (
    <FormControl
      fullWidth
      variant="standard"
      sx={{
        backgroundColor: "#FFFFFF !important",
        borderRadius: "20px",
        border: "1px solid #AAB8C2",
        padding: "25px",
        ":hover": {
          border: "1px solid #0072FF",
        },
        ":focus-within": {
          border: "1px solid #0072FF",
        },
      }}
    >
      <Grid2
        container
        justifyContent={"space-between"}
        columnSpacing={"10px"}
        wrap="nowrap"
      >
        <Grid2 container size="grow" justifyContent={"stretch"}>
          <Input
            id="chat"
            ref={inputRef}
            placeholder="Type your question"
            value={value}
            onChange={e => setValue(e.target.value)}
            disableUnderline
            multiline
            maxRows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(value);
                setValue("");
              }
            }}

            sx={{
              padding: 0,
              width: "100%",

              fontWeight: 400,
              fontSize: "20px",
              lineHeight: "170%",
              letterSpacing: "-0.3px",
              textAlign: "left",
              verticalAlign: "middle",
              backgroundColor: "transparent !important",
              
              color: "#000000",
              "& ::placeholder": {
                color: "#7A7B7E",
              },
              "& .Mui-disabled::placeholder": {
                color: "#7A7B7E",
                opacity: 1,
                WebkitTextFillColor: "#7A7B7E",
              },
            }}

            inputProps={{
              maxLength: 500,
            }}
          />
        </Grid2>
        <IconButton
          onClick={handleClick}
          sx={{
            width: "48px",
            height: "48px",
            alignSelf: "flex-end",
            backgroundColor: value != "" ? "#0072FF !important" : "#AAB8C2 !important",
            ":hover": {
              backgroundColor: "#0072FF !important",
            }
          }}
        >
          <ArrowUpward fontSize="large" sx={{ color: "white" }} />
        </IconButton>
      </Grid2>
    </FormControl>
  );
}