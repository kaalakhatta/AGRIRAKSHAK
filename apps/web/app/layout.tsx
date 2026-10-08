import type { Metadata } from "next";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { OfflineStatus } from "@/features/offline/offline-status";

export const metadata: Metadata = {
  title: "AgriRakshak",
  description: "A local-first farm companion with field records, crop cycles and preliminary disease screening.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><OfflineStatus />{children}</body>
    </html>
  );
}
