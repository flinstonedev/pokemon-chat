import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokemon Chat",
  description: "Chat with your favorite Pokemon!",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <footer className="bg-gray-900 text-gray-300 py-6">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-sm">
                    <p>&copy; {new Date().getFullYear()} QuerySculptor Pokemon API Demo</p>
                    <p className="text-gray-400 mt-1">
                      Showcasing QuerySculptor MCP capabilities with Pokemon data
                    </p>
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
                  <p>
                    Pokemon is a trademark of Nintendo/Game Freak/The Pokemon Company.
                    This demo is not affiliated with or endorsed by Nintendo.
                  </p>
                </div>
              </div>
            </footer>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
