import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import "./github.min.css";

import CssBaseline from "@mui/material/CssBaseline";

export const metadata: Metadata = {
  title: "Mobilint, Inc. ARIES LLM Demo",
  description: "Mobilint, Inc. ARIES LLM Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CssBaseline />
      <body style={{backgroundColor: "#F6F6F6"}}>
        {children}
      </body>
    </html>
  );
}
