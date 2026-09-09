import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Merienda — Dónde merendar y comer en San Juan",
    template: "%s · Merienda",
  },
  description:
    "Guía sanjuanina de merienda y comida en los 19 departamentos: restoranes, pizzerías, heladerías, pachatas y herboristerías que el mapa de Capital no encuentra.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Merienda",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/fondo-agua-verde.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4efe6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex min-h-full flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
