import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { CookieBanner } from "@/components/CookieBanner";
import { ThemeProvider } from "@/components/ThemeProvider";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
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
              <SettingsProvider>
                <div className="flex flex-1 flex-col">{children}</div>
              </SettingsProvider>
              <footer className="bg-surface-2 border-border/50 text-foreground border-t py-6 backdrop-blur-md">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
                    <div className="text-sm">
                      <p>
                        &copy; {new Date().getFullYear()} QuerySculptor Pokemon
                        API Demo
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Showcasing QuerySculptor MCP capabilities with Pokemon
                        data
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
                    <p>
                      Pokemon is a trademark of Nintendo/Game Freak/The Pokemon
                      Company. This demo is not affiliated with or endorsed by
                      Nintendo.
                    </p>
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
