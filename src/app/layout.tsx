import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@fontsource/cascadia-code/latin-400.css";
import "@fontsource/cascadia-code/latin-700.css";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var e=localStorage.getItem('codereflex-ui');if(e){var t=JSON.parse(e);if(t&&t.state&&t.state.theme==='dark')document.documentElement.classList.add('dark')}}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
