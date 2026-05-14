import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeReflex - Plataforma de Entrenamiento Técnico",
  description: "Domina la programación a través de la práctica reflex y la resolución de problemas guiados. Prepárate para entrevistas técnicas con ejercicios del mundo real.",
  keywords: ["coding", "programming", "training", "typing", "reflex", "interview", "practice"],
  authors: [{ name: "CodeReflex" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}