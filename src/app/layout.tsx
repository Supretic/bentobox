import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BentoBox",
  description: "Groceries in. Meals out. Macros known.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-body text-lacquer">{children}</body>
    </html>
  );
}
