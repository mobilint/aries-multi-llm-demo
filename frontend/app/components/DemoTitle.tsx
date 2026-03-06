import { Typography } from "@mui/material";

export default function DemoTitle({
  color,
  modelCount,
}: {
  color?: string,
  modelCount?: number,
}) {
  const mlaLabel = modelCount === 16 ? "MLA400" : modelCount === 4 ? "MLA100" : "???";

  return (
    <Typography
      sx={{
        fontWeight: 400,
        fontSize: "34.52px",
        lineHeight: "130%",
        letterSpacing: "-0.3px",
        textAlign: "left",
        verticalAlign: "middle",
        color: color || "#FFFFFF",
      }}
    >
      <span style={{fontWeight: 600}}>Multi-LLM Demo</span><span style={{display: "inline-block", width: "2.03px", height: "25.38px", backgroundColor: color || "#ffffff", margin: "auto 17.26px"}}></span>Powered by <span style={{fontWeight: 600}}>{mlaLabel}</span>
    </Typography>
  );
}
