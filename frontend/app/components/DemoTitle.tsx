import { Typography } from "@mui/material";

export default function DemoTitle({
  color,
}: {
  color?: string,
}) {
  return (
    <Typography
      sx={{
        fontWeight: 600,
        fontSize: "48px",
        lineHeight: "130%",
        letterSpacing: "-0.2px",
        textAlign: "left",
        verticalAlign: "middle",
        color: color || "#FFFFFF",
      }}
    >
      Multi-LLM Powered by ARIES
    </Typography>
  );
}
