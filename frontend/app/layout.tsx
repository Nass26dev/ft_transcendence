import type { Metadata } from "next";
import { Archivo, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MotionProvider } from "@/components/ui/motion";


// Texte / UI — moderne, dense, lisible
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

// Titres — grotesque athlétique, look "sport"
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

// Chiffres / cotes
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kop",
  description: "Le paris sportif sans pognon. 100 % adrénaline, 0 % facture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${interTight.variable} ${archivo.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">

        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <MotionProvider>{children}</MotionProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
