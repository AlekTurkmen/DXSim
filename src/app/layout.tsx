import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ConditionalLayout } from "@/components/conditional-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = localFont({
  src: "../../public/fonts/InstrumentSerif-Regular.ttf",
  variable: "--font-title",
  weight: "400",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DXSim - The Diagnostic Simulator for Medical Professionals",
  description:
    "We simulate dynamic clinical reasoning through a SOTA sequantial diagnostic simulator.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/assets/favicon.ico" },
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/assets/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/assets/site.webmanifest",
  openGraph: {
    title: "DXSim - The Diagnostic Simulator for Medical Professionals",
    description:
      "We simulate dynamic clinical reasoning through a SOTA sequantial diagnostic simulator.",
    type: "website",
    images: [
      {
        url: "/assets/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DXSim – The diagnostic simulator for medical professionals.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
