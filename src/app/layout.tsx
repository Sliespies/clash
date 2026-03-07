import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Clash of the Companies",
  description: "Score tracking voor Clash of the Companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${inter.variable} font-sans tracking-tight bg-gray-100 text-gray-800 min-h-screen flex flex-col items-center justify-center`}
      >
        {children}
      </body>
    </html>
  );
}
