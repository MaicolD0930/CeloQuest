import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { AppConfigLoader } from "@/components/AppConfigLoader";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CeloQuest",
  description: "Learn Web3. Explore Celo. Earn your place.",
};

export const viewport: Viewport = {
  themeColor: "#232329",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-h-background">
        <LocaleProvider>
          <AppConfigLoader>
            <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden">
              {children}
            </div>
          </AppConfigLoader>
        </LocaleProvider>
      </body>
    </html>
  );
}
