import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AVAL",
  description: "Undercollateralized lending, backed by verified identity.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-navy text-ivory font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
