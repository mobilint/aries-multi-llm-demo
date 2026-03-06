import { Grid2, Typography } from "@mui/material";
import ContactUsButton from "./ContactUsButton";
import MobilintIncPanel from "./MobilintIncPanel";
import { LLMClient } from "./type";
import ModelList from "./ModelList";

export default function Sidebar({
  models,
  client,
  reset,
  changeModel,
  setCurrentDevNo,
}: {
  models: string[],
  client: LLMClient,
  reset: () => void,
  changeModel: (model: string) => void,
  setCurrentDevNo: (dev_no: number | null) => void,
}){
  return (
    <Grid2
      container
      direction="column"
      justifyContent="space-between"
      alignItems="stretch"
      sx={{
        width: "354px",
        padding: "47px 20px 26px 20px",
        backgroundColor: "#002D66",
      }}
    >
      <MobilintIncPanel
        onReset={reset}
        resetDisabled={client.dialog.length == 0}
        setCurrentDevNo={setCurrentDevNo}
      />
      <Typography
        sx={{
          marginTop: "62px",
          marginLeft: "14px",
          marginBottom: "20px",
          fontWeight: 400,
          fontSize: "17px",
          lineHeight: "130%",
          letterSpacing: "-0.3px",
          textAlign: "left",
          verticalAlign: "middle",
          color: "#FFFFFF",
        }}
      >
        Select a model to chat!
      </Typography>
      <Grid2
        container
        size="grow"
        direction="column"
        wrap="nowrap"
        justifyContent="stretch"
        alignItems="stretch"
        rowSpacing={"8px"}
        sx={{
          overflowY: "auto",
        }}
      >
        <ModelList
          models={models}
          currentModel={client.model_id}
          changeModel={changeModel}
        />
      </Grid2>
      <ContactUsButton reset={reset} />
      <Typography
        sx={{
          marginTop: "33px",
          fontWeight: "400",
          fontSize: "16px",
          lineHeight: "150%",
          letterSpacing: "-0.2px",
          textAlign: "center",
          verticalAlign: "top",
          color: "#FFFFFF88",
        }}
      >
        © 2025 Mobilint, Inc. All rights reserved
      </Typography>
    </Grid2>
  );
}