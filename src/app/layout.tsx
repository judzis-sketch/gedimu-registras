import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FaultsProvider } from "@/context/faults-context";
import { WorkersProvider } from "@/context/workers-context";
import { ForbiddenWordsProvider } from "@/context/forbidden-words-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gedimų Registras",
  description: "Gedimų registravimo platforma",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <WorkersProvider>
          <FaultsProvider>
            <ForbiddenWordsProvider>
              {children}
              <Toaster />
            </ForbiddenWordsProvider>
          </FaultsProvider>
        </WorkersProvider>
      </body>
    </html>
  );
}
