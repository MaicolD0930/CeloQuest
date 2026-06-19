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
  other: {
    "talentapp:project_verification":
      "1770a8a8ae5cce3e0c74ac33a348eb7ff8fd28bb647f273eda1a8adc06667eb779138e3defda4f308560d39a792cc3ff9172beac4352d6c7028077ed90e9fc87",
  },
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
