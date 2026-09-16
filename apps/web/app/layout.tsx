import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "AgriRakshak",
  description: "Crop disease screening and learning, built for the field and classroom.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
