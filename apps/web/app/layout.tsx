import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "AgriRakshak",
  description: "A local-first farm companion with field records, crop cycles and preliminary disease screening.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
