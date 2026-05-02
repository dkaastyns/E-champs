import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Champs | Level Up Your Game",
  description: "Join the ultimate esports tournament platform. Register your team, compete against the best, and claim your victory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        bebasNeue.variable,
        spaceGrotesk.variable,
        inter.variable,
      )}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="E-Champs" />
      </head>
      <body className="min-h-full flex flex-col bg-[#080808] font-[family-name:var(--font-body)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
