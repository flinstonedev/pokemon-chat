import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { CookieBanner } from "@/components/CookieBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UIComponentProvider } from "@/components/UIComponentProvider";

const firaCode = localFont({
  src: [
    {
      path: "../public/fonts/FiraCode-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/FiraCode-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/FiraCode-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/FiraCode-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/FiraCode-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GraphQL Chat",
  description: "Chat with any GraphQL API!",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${firaCode.className} flex min-h-screen flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClerkProvider dynamic>
            <ConvexClientProvider>
              <UIComponentProvider>
                <SettingsProvider>
                  <div className="flex flex-1 flex-col">{children}</div>
                </SettingsProvider>
              </UIComponentProvider>
              <footer className="bg-surface-2 border-border/50 text-foreground border-t py-6 backdrop-blur-md">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
                    <div className="text-sm">
                      <p>&copy; {new Date().getFullYear()} GraphQL Chat</p>
                      <p className="text-muted-foreground mt-1">
                        Powered by QuerySculptor MCP
                      </p>
                    </div>
                    <div className="flex space-x-6 text-sm">
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        Terms of Service
                      </Link>
                    </div>
                  </div>
                  <div className="border-border/50 text-muted-foreground mt-4 border-t pt-4 text-center text-xs">
                    <p>Built with Next.js, Vercel AI SDK, and MCP.</p>
                  </div>
                </div>
              </footer>
            </ConvexClientProvider>
          </ClerkProvider>
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
