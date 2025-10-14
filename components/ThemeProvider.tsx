"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type ThemeName, defaultTheme } from "@/lib/themes/themes";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme: initialTheme = defaultTheme,
  storageKey = "pokemon-chat-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey) as ThemeName | null;
      if (storedTheme && (storedTheme === "dark" || storedTheme === "light")) {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.error("Failed to load theme from localStorage:", error);
    }
  }, [storageKey]);

  // Apply theme to document element immediately
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("dark", "light");
    
    // Add the current theme class
    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.error("Failed to save theme to localStorage:", error);
    }
    setThemeState(newTheme);
  };

  // Always provide context, even before mounting
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
