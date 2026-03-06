import { Grid2, GridBaseProps } from "@mui/material";
import { LLMClient } from "./type";
import Dialog from "./Dialog";
import { useRef } from "react";
import ModelLabel from "./ModelLabel";

export default function AutoPromsptingClient({
  size,
  client,
  onLabelClick,
  isDarkMode,
}: {
  size?: GridBaseProps["size"],
  client: LLMClient,
  onLabelClick: () => void,
  isDarkMode: boolean,
}) {
  const scrollGridRef = useRef<HTMLDivElement | null>(null);
  
  return (
    <Grid2
      container
      direction="column"
      alignItems={"flex-start"}
      size={size}
      rowSpacing={"40px"}
      sx={{
        padding: "34px 32px",
        backgroundColor: isDarkMode ? "#212631" : "#F8F9FD",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    >
      <ModelLabel
        model_id={client.model_id}
        onClick={onLabelClick}
        isDarkMode={isDarkMode}
      />
      <Grid2
        container
        size="grow"
        direction="column"
        wrap="nowrap"
        alignSelf="stretch"
        justifyContent="stretch"
        alignItems={"stretch"}
        rowSpacing="34px"
        sx={{
          overflowY: "scroll",
        }}
        ref={scrollGridRef}
      >
        <Dialog
          client={client}
          scrollGridRef={scrollGridRef}
          isDarkMode={isDarkMode}
        />
      </Grid2>
    </Grid2>
  );
}