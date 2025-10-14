# Using Gradients in the Theming System

## Standard CVA + Tailwind Pattern

This project follows the standard **Class Variance Authority (CVA)** and **Tailwind CSS** theming pattern used by shadcn/ui and similar component libraries.

## ✅ Correct Way to Use Gradients

Always use Tailwind utility classes (powered by our custom plugin):

```tsx
// ✅ Correct - Standard CVA/Tailwind approach
<div className="bg-gradient-primary rounded-lg p-4">
  Content
</div>

// ✅ For text gradients
<h1 className="bg-gradient-primary bg-clip-text text-transparent">
  Gradient Text
</h1>
```

## ❌ Incorrect Way

```tsx
// ❌ Wrong - Don't use inline styles (breaks CVA pattern)
<div style={{ background: 'var(--gradient-primary)' }}>
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
<button className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg">
  Click Me
</button>
```

### Icon Container with Gradient
```tsx
<div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center">
  <Icon className="text-accent-foreground" />
</div>
```

### Full Page Background Gradient
```tsx
<div className="min-h-screen bg-gradient-surface">
  <YourContent />
</div>
```

### Gradient Text
```tsx
<h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
  Gradient Text
</h1>
```

## Button Component Variants

If you're using the `Button` component from `components/ui/button.tsx`, you can use the gradient variants:

```tsx
import { Button } from "@/components/ui/button";

// These variants use CVA with Tailwind classes
<Button variant="gradient">Primary Gradient</Button>
<Button variant="gradient-accent">Accent Gradient</Button>
```

Note: These variants use the `bg-gradient-*` Tailwind utilities defined in our custom plugin.

## Why This Approach?

1. **Standard Pattern**: Follows CVA + Tailwind best practices (shadcn/ui pattern)
2. **Theme Consistency**: Gradients automatically update when theme changes
3. **Maintainability**: All gradient definitions in one place (`globals.css`)
4. **Performance**: No re-renders needed, just CSS variable updates
5. **CVA Compatible**: Works seamlessly with Class Variance Authority
6. **No Inline Styles**: Keeps component code clean and maintainable

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

3. **Add to Tailwind plugin** (`tailwind.config.ts`):
   ```typescript
   plugin(({ addUtilities }) => {
       addUtilities({
           '.bg-gradient-my-new': {
               background: 'var(--gradient-my-new)',
           },
       });
   }),
   ```

4. **Use in components**:
   ```tsx
   <div className="bg-gradient-my-new">
     Content
   </div>
   ```

## Troubleshooting

### Gradient not showing
- Verify the gradient is defined in `globals.css` for all themes
- Check that the utility class is defined in the Tailwind plugin (`tailwind.config.ts`)
- Ensure the class name matches exactly (e.g., `bg-gradient-primary`)

### Gradient not changing with theme
- Verify the CSS variable is defined differently in each theme's CSS (`:root`/`.light` and `.dark`)
- Make sure you're using the utility class, not inline styles
- Check that ThemeProvider is properly wrapping your app

### Text gradient not working
- Use both `bg-gradient-*` AND `bg-clip-text text-transparent` classes
- Example: `className="bg-gradient-primary bg-clip-text text-transparent"`
- The gradient class sets the background, bg-clip-text clips it to text
