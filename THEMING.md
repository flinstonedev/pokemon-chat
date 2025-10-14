# Theming System Documentation

This document describes the comprehensive theming system implemented in the Pokemon Chat application. The system follows **industry-standard best practices** used by shadcn/ui and the wider Next.js ecosystem.

## Overview

The theming system uses:
- **CSS Variables** for dynamic color tokens
- **TailwindCSS** for utility-first styling
- **next-themes** for theme state management (industry standard)
- **localStorage** for theme persistence (automatic)

## Architecture

### 1. Theme Configuration (`app/globals.css`)

Themes are defined purely in CSS using CSS custom properties (variables). This follows the shadcn/ui pattern:

- **Colors**: All color tokens (background, foreground, primary, secondary, etc.)
- **Shadows**: Shadow definitions for different elevations
- **Gradients**: Predefined gradient styles
- **Backdrop**: Blur values for glass-morphism effects

No TypeScript configuration needed - everything is in CSS!

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

A thin wrapper around `next-themes` that:
- Manages the current theme state
- Applies theme classes to the document root
- Persists theme preference to localStorage (automatic)
- Handles SSR/hydration issues (automatic)
- Provides `useTheme()` hook for components

#### Usage in Components

```typescript
import { useTheme } from "next-themes";

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

**Note:** Always import `useTheme` from `"next-themes"`, not from the local provider component.

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

### 1. Add CSS Variables

In `app/globals.css`, add a new theme class:

```css
/* ===========================
   Blue Theme
   =========================== */
.blue {
  /* Base colors */
  --background: oklch(0.20 0.02 240);
  --foreground: oklch(0.98 0.005 240);
  
  /* Card colors */
  --card: oklch(0.22 0.015 240);
  --card-foreground: oklch(0.98 0.005 240);
  
  /* ... define all color tokens following the same pattern as .dark */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  /* ... define shadows */
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, ...);
  /* ... define gradients */
  
  /* Backdrop blur */
  --backdrop-blur-sm: 8px;
  /* ... define backdrop blur values */
}
```

### 2. Add Gradient Utility (if using custom gradients)

In `tailwind.config.ts`, add to the plugin:

```typescript
plugin(({ addUtilities }) => {
    addUtilities({
        '.bg-gradient-primary': {
            background: 'var(--gradient-primary)',
        },
        // Add more gradient utilities as needed
    });
}),
```

### 3. Update Theme Provider (Optional)

If you want to allow multiple themes, update the `themes` prop in `layout.tsx`:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  themes={['light', 'dark', 'blue']} // Add your new theme
  enableSystem={false}
  disableTransitionOnChange
>
```

### 4. Update Theme Selector (Optional)

For a dropdown selector:

```tsx
import { useTheme } from "next-themes";

function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  
  return (
    <select 
      value={theme} 
      onChange={(e) => setTheme(e.target.value)}
    >
      {themes?.map((themeName) => (
        <option key={themeName} value={themeName}>
          {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
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

### next-themes Integration

**Why next-themes?**
- Industry-standard solution used by shadcn/ui
- Battle-tested with 50k+ weekly downloads
- Handles SSR/hydration automatically
- No flash of unstyled content (FOUC)
- Built-in localStorage management
- Supports system theme detection

### SSR Compatibility

The theme provider uses `next-themes` which:
- Injects a script tag before render to prevent FOUC
- Works seamlessly with Next.js SSR
- `suppressHydrationWarning` on `<html>` prevents hydration warnings
- Default theme is applied immediately

### Performance

- CSS variables enable instant theme switching
- No re-renders of child components when theme changes
- Only the document root class changes
- Minimal bundle size (~2KB)

### Browser Support

The theming system uses:
- **CSS Variables**: Supported in all modern browsers
- **OKLCH Color Space**: Progressive enhancement (falls back gracefully)
- **localStorage**: Automatic via next-themes

### Migration from Custom Provider

This project was migrated from a custom theme provider to `next-themes` for:
1. **Standardization**: Follow industry best practices
2. **Maintainability**: Less code to maintain
3. **Reliability**: Battle-tested edge case handling
4. **Features**: System theme detection, storage events, etc.

The old `lib/themes/themes.ts` TypeScript config file is no longer needed - all theme configuration is now in CSS as per the standard pattern.

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
