import { Button, Grid2 } from "@mui/material";
import Image from "next/image";
import ModelIcon from "./ModelIcon";

export default function ModelButton({
  model,
  currentModel,
  changeModel,
}: {
  model: string,
  currentModel: string,
  changeModel: (model: string) => void,
}) {
  return (
    <Button
      fullWidth
      disableRipple
      onClick={(e) => changeModel(model)}
      sx={{
        padding: "10px 14px",
        height: "50px",
        textTransform: "none",
        justifyContent: "flex-start",
        alignItems: "center",
        fontWeight: 400,
        fontSize: "17px",
        lineHeight: "130%",
        letterSpacing: "-0.3px",
        color: "#FFFFFF !important",
        backgroundColor: currentModel == model ? "#0072FF" : "transparent",
        borderRadius: "10px",
        ":hover": {
          backgroundColor: currentModel == model ? "#0072FF" : "#003E8A",
        }
      }}
    >
      <Grid2
        style={{
          padding: "5px",
          width: "30px",
          height: "30px",
          backgroundColor: "#FFFFFF",
          borderRadius: "5px",
          marginRight: "12px",
        }}
      >
        <ModelIcon
          model_id={model}
          width="20px"
        />
      </Grid2>
      <Grid2
        size="grow"
        style={{
          textAlign: "left",
          whiteSpace: "nowrap",
          overflow: "auto",
        }}
      >
        {model.split("/")[1].replaceAll("-", " ")}
      </Grid2>
    </Button>
  );
}