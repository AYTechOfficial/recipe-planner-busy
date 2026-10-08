import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build me a recipe planner for busy students",
  description: "A focused me recipe planner busy students product, positioned against what the sources below already cover.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
