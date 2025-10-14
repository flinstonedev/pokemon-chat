# Theming System Documentation

This document describes the comprehensive theming system implemented in the Pokemon Chat application. The system is designed to be flexible, extensible, and easy to maintain.

## Overview

The theming system uses:
- **CSS Variables** for dynamic color tokens
- **TailwindCSS** for utility-first styling
- **React Context** for theme state management
- **localStorage** for theme persistence

## Architecture

### 1. Theme Configuration (`lib/themes/themes.ts`)

This is the central configuration file where all themes are defined. Each theme includes:

- **Colors**: All color tokens (background, foreground, primary, secondary, etc.)
- **Shadows**: Shadow definitions for different elevations
- **Gradients**: Predefined gradient styles
- **Backdrop**: Blur values for glass-morphism effects

#### Current Themes

**Dark Theme** (default)
- Dark blue-tinted background
- Electric blue primary color (inspired by Pikachu)
- Purple/violet accent color (psychic Pokemon vibes)
- High contrast for readability

**Light Theme**
- Clean white background
- Deep blue primary color
- Purple accent color
- Optimized for daylight viewing

### 2. Theme Provider (`components/ThemeProvider.tsx`)

A React Context provider that:
- Manages the current theme state
- Applies theme classes to the document root
- Persists theme preference to localStorage
- Provides `useTheme()` hook for components

#### Usage in Components

```typescript
import { useTheme } from "@/components/ThemeProvider";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  // Switch theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### 3. Global Styles (`app/globals.css`)

Contains CSS variable definitions for both themes:
- `:root` and `.light` define light theme variables
- `.dark` defines dark theme variables
- All variables follow a consistent naming convention

#### CSS Variable Naming

- `--background` / `--foreground`: Base colors
- `--card` / `--card-foreground`: Card components
- `--primary` / `--primary-foreground`: Primary action colors
- `--secondary` / `--secondary-foreground`: Secondary elements
- `--muted` / `--muted-foreground`: Muted/disabled states
- `--accent` / `--accent-foreground`: Accent elements
- `--border` / `--input` / `--ring`: UI element borders
- `--surface-1/2/3`: Layered surfaces with opacity
- `--chart-1/2/3/4/5`: Data visualization colors

### 4. Tailwind Configuration (`tailwind.config.ts`)

Extends Tailwind with theme-aware utilities:
- Color classes that reference CSS variables
- Custom shadow utilities
- Gradient backgrounds
- Backdrop blur utilities

## Using Themed Colors in Components

### Via Tailwind Classes

```tsx
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>
```

### Via CSS Variables

```tsx
<div style={{ 
  backgroundColor: 'var(--background)',
  color: 'var(--foreground)'
}}>
  Content
</div>
```

### Gradients

```tsx
<div className="bg-gradient-primary">
  Gradient background
</div>
```

### Surfaces (Glass-morphism)

```tsx
<div className="bg-surface-2 backdrop-blur-md">
  Frosted glass effect
</div>
```

## Theme Toggle Component

The `ThemeToggle` component (`components/ThemeToggle.tsx`) provides a user-friendly way to switch themes:

- Animated sun/moon icons
- Accessible with ARIA labels
- Smooth transitions
- Can be placed anywhere in the app

## Adding a New Theme

To add a new theme (e.g., "blue", "green", "high-contrast"):

### 1. Update Type Definition

In `lib/themes/themes.ts`:

```typescript
export type ThemeName = 'dark' | 'light' | 'blue';
```

### 2. Add Theme Configuration

```typescript
export const themes: Record<ThemeName, ThemeConfig> = {
  // ... existing themes
  
  blue: {
    name: 'blue',
    displayName: 'Ocean Blue',
    colors: {
      background: 'oklch(0.20 0.02 240)',
      foreground: 'oklch(0.98 0.005 240)',
      // ... define all color tokens
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      // ... define shadows
    },
    gradients: {
      primary: 'linear-gradient(135deg, ...)',
      // ... define gradients
    },
    backdrop: {
      blurSm: '8px',
      // ... define backdrop blur values
    },
  },
};
```

### 3. Add CSS Variables

In `app/globals.css`:

```css
/* ===========================
   Blue Theme
   =========================== */
.blue {
  /* Base colors */
  --background: oklch(0.20 0.02 240);
  --foreground: oklch(0.98 0.005 240);
  
  /* ... all other color tokens */
}
```

### 4. Update Theme Selector (Optional)

If you want a theme selector dropdown instead of a toggle:

```tsx
import { useTheme } from "@/components/ThemeProvider";
import { getThemeNames, themes } from "@/lib/themes/themes";

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const themeNames = getThemeNames();
  
  return (
    <select 
      value={theme} 
      onChange={(e) => setTheme(e.target.value as ThemeName)}
    >
      {themeNames.map((name) => (
        <option key={name} value={name}>
          {themes[name].displayName}
        </option>
      ))}
    </select>
  );
}
```

## Best Practices

### 1. Always Use Theme Variables

❌ **Don't** hardcode colors:
```tsx
<div className="bg-gray-900 text-white">
```

✅ **Do** use theme variables:
```tsx
<div className="bg-background text-foreground">
```

### 2. Use Semantic Color Names

Use semantic names that describe the purpose, not the color:
- ✅ `bg-primary` (semantic)
- ❌ `bg-blue-500` (specific color)

### 3. Test Both Themes

Always test your components in both light and dark themes to ensure:
- Text is readable
- Contrast is sufficient
- Visual hierarchy is maintained

### 4. Use Surface Layers for Depth

For layered UI elements, use surface tokens:
```tsx
<div className="bg-background">
  <div className="bg-surface-1 backdrop-blur-sm">
    <div className="bg-surface-2">
      Deepest layer
    </div>
  </div>
</div>
```

### 5. Leverage Gradient Utilities

Use predefined gradients for consistency:
```tsx
<button className="bg-gradient-primary text-primary-foreground">
  Action Button
</button>
```

## Accessibility

The theming system follows accessibility best practices:

1. **Sufficient Contrast**: All text colors meet WCAG AA standards
2. **Semantic HTML**: Theme toggle uses proper ARIA labels
3. **User Preference**: Theme choice is saved to localStorage
4. **No Flash**: `suppressHydrationWarning` prevents FOUC

## Technical Details

### SSR Compatibility

The theme provider is client-side only (`"use client"`) but designed to work seamlessly with Next.js SSR:
- Theme class is applied immediately on mount
- `suppressHydrationWarning` on `<html>` prevents hydration warnings
- Default theme is shown during SSR

### Performance

- CSS variables enable instant theme switching
- No re-renders of child components when theme changes
- Only the document root class changes

### Browser Support

The theming system uses:
- **CSS Variables**: Supported in all modern browsers
- **OKLCH Color Space**: Progressive enhancement (falls back gracefully)
- **localStorage**: Supported in all browsers

## Troubleshooting

### Theme not applying

1. Ensure ThemeProvider wraps your entire app
2. Check that components use theme variables, not hardcoded colors
3. Verify CSS variables are defined in globals.css

### Flash of unstyled content

1. Ensure `suppressHydrationWarning` is on the `<html>` element
2. Check that default theme is set correctly
3. Verify ThemeProvider is high in the component tree

### Theme not persisting

1. Check browser localStorage is enabled
2. Verify storageKey is consistent
3. Check for localStorage errors in console

## Future Enhancements

Potential additions to the theming system:

1. **System Preference Detection**: Auto-detect OS theme preference
2. **More Themes**: Add Pokemon-type themed variants (Fire, Water, Grass, etc.)
3. **Custom Theme Builder**: UI for users to create custom themes
4. **Theme Preview**: Live preview before applying theme
5. **Per-Component Themes**: Override theme for specific sections

## Resources

- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [CSS Variables Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [OKLCH Color Space](https://oklch.com/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
