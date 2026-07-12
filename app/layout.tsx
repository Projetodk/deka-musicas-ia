import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deka Músicas IA",
  description:
    "Músicas criadas por inteligência artificial, compartilhadas gratuitamente para ouvir online ou baixar e ouvir offline.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deka Músicas",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0d10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
