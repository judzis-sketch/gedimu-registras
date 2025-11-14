import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { ForbiddenWordsProvider } from "@/context/forbidden-words-context";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: "Autobusų Tvarkaraštis",
  description: "Autobusų tvarkaraščių platforma",
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
        <FirebaseClientProvider>
          <ForbiddenWordsProvider>
            {children}
            <Toaster />
          </ForbiddenWordsProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
