import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crypto Comparison Tool | Compare Multiple Cryptocurrencies",
  description:
    "Compare cryptocurrencies with real-time market data, social metrics, and supply information. Features include Twitter followers tracking, market cap comparison, and downloadable analysis.",
  keywords: [
    "cryptocurrency comparison",
    "crypto market data",
    "token comparison",
    "market cap comparison",
    "crypto metrics",
    "Twitter followers tracking",
    "crypto analysis tool",
    "real-time crypto data",
    "cryptocurrency metrics",
    "token analysis",
    "crypto market analysis",
    "digital currency comparison",
  ],
  openGraph: {
    title: "Crypto Comparison Tool",
    description:
      "Compare multiple cryptocurrencies with real-time market data and social metrics",
    type: "website",
    locale: "en_US",
    siteName: "Crypto Comparison Tool",
    images: [
      {
        url: "/banner.svg",
        width: 1200,
        height: 630,
        alt: "Crypto Comparison Tool Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Comparison Tool",
    description:
      "Compare multiple cryptocurrencies with real-time market data and social metrics",
    images: ["/banner.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ffffff",
  icons: {
    icon: [{ url: "/favicon.svg" }],
    apple: [{ url: "/favicon.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
