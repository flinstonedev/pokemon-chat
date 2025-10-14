/**
 * Theme Configuration Module
 * 
 * This module defines all available themes with their color tokens, gradients, shadows, and other visual properties.
 * To add a new theme, simply add a new entry to the themes object following the same structure.
 */

export type ThemeName = 'dark' | 'light';

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  colors: {
    // Base colors
    background: string;
    foreground: string;
    
    // Card colors
    card: string;
    cardForeground: string;
    
    // Popover colors
    popover: string;
    popoverForeground: string;
    
    // Primary colors
    primary: string;
    primaryForeground: string;
    
    // Secondary colors
    secondary: string;
    secondaryForeground: string;
    
    // Muted colors
    muted: string;
    mutedForeground: string;
    
    // Accent colors
    accent: string;
    accentForeground: string;
    
    // Destructive colors
    destructive: string;
    
    // Border and input colors
    border: string;
    input: string;
    ring: string;
    
    // Chart colors
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    
    // Sidebar colors
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    
    // Surface tokens for elevation and glass-morphism
    surface1: string;
    surface2: string;
    surface3: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  gradients: {
    primary: string;
    accent: string;
    surface: string;
  };
  backdrop: {
    blurSm: string;
    blurMd: string;
    blurLg: string;
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  dark: {
    name: 'dark',
    displayName: 'Dark Mode',
    colors: {
      // Dark background - slightly lighter for better contrast
      background: 'oklch(0.18 0.01 250)',
      foreground: 'oklch(0.98 0.005 250)',
      
      // Card colors - darker slate
      card: 'oklch(0.22 0.015 250)',
      cardForeground: 'oklch(0.98 0.005 250)',
      
      // Popover
      popover: 'oklch(0.20 0.012 250)',
      popoverForeground: 'oklch(0.98 0.005 250)',
      
      // Primary - Electric Blue (like Pikachu's electric attacks)
      primary: 'oklch(0.65 0.19 250)',
      primaryForeground: 'oklch(0.98 0.005 250)',
      
      // Secondary - Darker slate for assistant messages
      secondary: 'oklch(0.25 0.02 250)',
      secondaryForeground: 'oklch(0.95 0.005 250)',
      
      // Muted
      muted: 'oklch(0.28 0.02 250)',
      mutedForeground: 'oklch(0.65 0.015 250)',
      
      // Accent - Purple/Violet (Psychic Pokemon vibes)
      accent: 'oklch(0.55 0.15 290)',
      accentForeground: 'oklch(0.98 0.005 250)',
      
      // Destructive - Red
      destructive: 'oklch(0.55 0.22 25)',
      
      // Borders - subtle with slight blue tint
      border: 'oklch(0.30 0.02 250)',
      input: 'oklch(0.28 0.02 250)',
      
      // Ring - Electric blue
      ring: 'oklch(0.65 0.19 250)',
      
      // Charts
      chart1: 'oklch(0.60 0.20 250)', // Blue
      chart2: 'oklch(0.65 0.18 160)', // Green
      chart3: 'oklch(0.60 0.16 290)', // Purple
      chart4: 'oklch(0.65 0.20 340)', // Pink
      chart5: 'oklch(0.60 0.18 60)',  // Yellow
      
      // Sidebar
      sidebar: 'oklch(0.20 0.012 250)',
      sidebarForeground: 'oklch(0.98 0.005 250)',
      sidebarPrimary: 'oklch(0.65 0.19 250)',
      sidebarPrimaryForeground: 'oklch(0.98 0.005 250)',
      sidebarAccent: 'oklch(0.28 0.02 250)',
      sidebarAccentForeground: 'oklch(0.98 0.005 250)',
      sidebarBorder: 'oklch(0.30 0.02 250)',
      sidebarRing: 'oklch(0.65 0.19 250)',
      
      // Surface tokens for elevation and glass-morphism
      surface1: 'oklch(0.20 0.012 250 / 0.7)',
      surface2: 'oklch(0.24 0.015 250 / 0.8)',
      surface3: 'oklch(0.28 0.018 250 / 0.9)',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.2)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, oklch(0.65 0.19 250), oklch(0.60 0.18 220))',
      accent: 'linear-gradient(135deg, oklch(0.55 0.15 290), oklch(0.50 0.14 310))',
      surface: 'linear-gradient(180deg, oklch(0.18 0.01 250), oklch(0.15 0.012 250))',
    },
    backdrop: {
      blurSm: '8px',
      blurMd: '12px',
      blurLg: '16px',
    },
  },
  
  light: {
    name: 'light',
    displayName: 'Light Mode',
    colors: {
      // Light backgrounds
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.147 0.004 49.25)',
      
      // Card colors
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.147 0.004 49.25)',
      
      // Popover
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.147 0.004 49.25)',
      
      // Primary - Deep blue
      primary: 'oklch(0.45 0.15 250)',
      primaryForeground: 'oklch(0.985 0.001 106.423)',
      
      // Secondary - Light gray
      secondary: 'oklch(0.97 0.001 106.424)',
      secondaryForeground: 'oklch(0.216 0.006 56.043)',
      
      // Muted
      muted: 'oklch(0.97 0.001 106.424)',
      mutedForeground: 'oklch(0.553 0.013 58.071)',
      
      // Accent - Purple
      accent: 'oklch(0.50 0.15 290)',
      accentForeground: 'oklch(0.985 0.001 106.423)',
      
      // Destructive - Red
      destructive: 'oklch(0.577 0.245 27.325)',
      
      // Borders
      border: 'oklch(0.923 0.003 48.717)',
      input: 'oklch(0.923 0.003 48.717)',
      
      // Ring
      ring: 'oklch(0.45 0.15 250)',
      
      // Charts
      chart1: 'oklch(0.55 0.20 250)', // Blue
      chart2: 'oklch(0.55 0.18 160)', // Green
      chart3: 'oklch(0.50 0.16 290)', // Purple
      chart4: 'oklch(0.60 0.20 340)', // Pink
      chart5: 'oklch(0.65 0.20 60)',  // Yellow
      
      // Sidebar
      sidebar: 'oklch(0.985 0.001 106.423)',
      sidebarForeground: 'oklch(0.147 0.004 49.25)',
      sidebarPrimary: 'oklch(0.45 0.15 250)',
      sidebarPrimaryForeground: 'oklch(0.985 0.001 106.423)',
      sidebarAccent: 'oklch(0.97 0.001 106.424)',
      sidebarAccentForeground: 'oklch(0.216 0.006 56.043)',
      sidebarBorder: 'oklch(0.923 0.003 48.717)',
      sidebarRing: 'oklch(0.45 0.15 250)',
      
      // Surface tokens for elevation
      surface1: 'oklch(0.98 0.001 106.423 / 0.7)',
      surface2: 'oklch(0.96 0.001 106.423 / 0.8)',
      surface3: 'oklch(0.94 0.002 106.423 / 0.9)',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, oklch(0.45 0.15 250), oklch(0.50 0.14 230))',
      accent: 'linear-gradient(135deg, oklch(0.50 0.15 290), oklch(0.55 0.14 310))',
      surface: 'linear-gradient(180deg, oklch(1 0 0), oklch(0.98 0.001 106.423))',
    },
    backdrop: {
      blurSm: '8px',
      blurMd: '12px',
      blurLg: '16px',
    },
  },
};

export const defaultTheme: ThemeName = 'dark';

/**
 * Get a theme configuration by name
 */
export function getTheme(name: ThemeName): ThemeConfig {
  return themes[name];
}

/**
 * Get all available theme names
 */
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}
