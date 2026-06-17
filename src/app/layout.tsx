import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuralFoundry",
  description: "Cyberpunk AI Agent Factory — Simulation Prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
