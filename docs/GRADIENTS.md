# Using Gradients in the Theming System

## The Issue with Tailwind Gradient Classes

Tailwind's utility classes like `bg-gradient-primary` don't properly reference CSS custom properties that change based on theme. This causes issues where gradients don't update when switching themes.

## ✅ Correct Way to Use Gradients

Always use inline styles with CSS variables:

```tsx
// ✅ Correct - Gradients work in all themes
<div 
  className="rounded-lg p-4"
  style={{ background: 'var(--gradient-primary)' }}
>
  Content
</div>

// ✅ For background-image (like text gradients)
<h1 
  className="bg-clip-text text-transparent"
  style={{ backgroundImage: 'var(--gradient-primary)' }}
>
  Gradient Text
</h1>
```

## ❌ Incorrect Way

```tsx
// ❌ Wrong - Won't work properly with theme switching
<div className="bg-gradient-primary">
  Content
</div>
```

## Available Gradients

The theming system provides three gradient variables:

### `--gradient-primary`
Primary action gradient (used for buttons, CTAs)
- **Dark theme**: Electric blue gradient
- **Light theme**: Deep blue gradient

### `--gradient-accent`
Accent gradient (used for highlights, badges)
- **Dark theme**: Purple/violet gradient
- **Light theme**: Purple gradient

### `--gradient-surface`
Surface gradient (used for backgrounds)
- **Dark theme**: Dark blue vertical gradient
- **Light theme**: Light gray vertical gradient

## Common Use Cases

### Button with Gradient
```tsx
<button
  className="px-4 py-2 rounded-lg text-primary-foreground"
  style={{ background: 'var(--gradient-primary)' }}
>
  Click Me
</button>
```

### Icon Container with Gradient
```tsx
<div
  className="w-16 h-16 rounded-2xl flex items-center justify-center"
  style={{ background: 'var(--gradient-accent)' }}
>
  <Icon className="text-accent-foreground" />
</div>
```

### Full Page Background Gradient
```tsx
<div
  className="min-h-screen"
  style={{ background: 'var(--gradient-surface)' }}
>
  <YourContent />
</div>
```

### Gradient Text
```tsx
<h1
  className="text-4xl font-bold bg-clip-text text-transparent"
  style={{ backgroundImage: 'var(--gradient-primary)' }}
>
  Gradient Text
</h1>
```

## Button Component Variants

If you're using the `Button` component from `components/ui/button.tsx`, you can use the gradient variants:

```tsx
import { Button } from "@/components/ui/button";

// These variants properly handle gradients
<Button variant="gradient">Primary Gradient</Button>
<Button variant="gradient-accent">Accent Gradient</Button>
```

Note: These variants internally use inline styles, so they work correctly with theme switching.

## Why This Approach?

1. **Theme Consistency**: Gradients automatically update when theme changes
2. **Maintainability**: All gradient definitions in one place (`globals.css`)
3. **Performance**: No re-renders needed, just CSS variable updates
4. **Type Safety**: TypeScript enforces available gradient names

## Adding New Gradients

To add a new gradient:

1. **Define in theme config** (`lib/themes/themes.ts`):
   ```typescript
   gradients: {
     primary: '...',
     accent: '...',
     surface: '...',
     myNewGradient: 'linear-gradient(135deg, ...)',
   }
   ```

2. **Add CSS variable** (`app/globals.css`):
   ```css
   :root {
     --gradient-my-new: linear-gradient(135deg, ...);
   }
   
   .dark {
     --gradient-my-new: linear-gradient(135deg, ...);
   }
   ```

3. **Use in components**:
   ```tsx
   <div style={{ background: 'var(--gradient-my-new)' }}>
     Content
   </div>
   ```

## Troubleshooting

### Gradient not showing
- Check that you're using `background` not `backgroundColor`
- Verify the gradient is defined in `globals.css` for all themes
- Ensure you're using `var(--gradient-name)` syntax

### Gradient not changing with theme
- Make sure you're using inline styles, not Tailwind classes
- Verify the gradient is defined differently in each theme's CSS

### Text gradient not working
- Use `backgroundImage` instead of `background` for text
- Include `bg-clip-text text-transparent` classes
- Example: `style={{ backgroundImage: 'var(--gradient-primary)' }}`
