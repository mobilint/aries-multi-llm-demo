import { Button, Grid2, Typography } from "@mui/material";
import ModelGroupImage from "./ModelGroupImage";

export default function ModelLabel({
  model_id,
  onClick,
  isDarkMode,
}: {
  model_id: string,
  onClick: () => void,
  isDarkMode: boolean,
}) {
  const model_group = model_id.split("/")[0];
  const model_name = model_id.split("/")[1];
  const model_group_image_text = model_group == "LGAI-EXAONE" ? "EXAONE" :
                                  model_group == "naver-hyperclovax" ? "HyperCLOVAX" :
                                  model_group == "meta-llama" ? "Meta" :
                                  model_group == "CohereLabs" ? "cohere" :
                                  model_group == "Qwen" ? "Qwen" : "";

  const model_name_without_group_name = model_name.startsWith(model_group_image_text) ? model_name.replace(model_group_image_text, "") : model_name;
  const model_name_without_dash = model_name_without_group_name.replaceAll("-", " ").trim();

  return (
    <Button
      onClick={onClick}
      sx={{
        padding: "10px 23px",
        borderRadius: "30px",
        backgroundColor: "#FFFFFF",
        outline: isDarkMode ? undefined : "1px solid #AAB8C2",
        textTransform: "none",
        ":hover": {
          outline: "2px solid #0072FF",
        }
      }}
    >
      <Grid2
        container
        columnSpacing={"10px"}
        alignItems={"center"}
        wrap="nowrap"
        overflow="hidden"
      >
        <ModelGroupImage
          model_id={model_id}
          height={"27px"}
        />
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: "20px",
            lineHeight: "120%",
            letterSpacing: "-0.22px",
            textAlign: "center",
            verticalAlign: "middle",
            color: "#212631",
            textWrap: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {model_name_without_dash}
        </Typography>
      </Grid2>
    </Button>
  )
}