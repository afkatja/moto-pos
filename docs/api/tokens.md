# Tokens API Reference

Design tokens for consistent styling across MOTO POS components.

## CSS Custom Properties

The tokens are exported as CSS custom properties in `tokens.css`:

```css
:root {
  --moto-pos-color-primary: #635bff;
  --moto-pos-color-primary-hover: #524ee8;
  --moto-pos-color-success: #10b981;
  --moto-pos-color-error: #ef4444;
  --moto-pos-color-warning: #f59e0b;
  
  --moto-pos-radius-sm: 4px;
  --moto-pos-radius-md: 8px;
  --moto-pos-radius-lg: 12px;
  
  --moto-pos-spacing-xs: 4px;
  --moto-pos-spacing-sm: 8px;
  --moto-pos-spacing-md: 16px;
  --moto-pos-spacing-lg: 24px;
  
  --moto-pos-font-family: system-ui, -apple-system, sans-serif;
  --moto-pos-font-size-sm: 14px;
  --moto-pos-font-size-md: 16px;
  --moto-pos-font-size-lg: 18px;
}
```

## Usage

Import the CSS file in your application:

```typescript
import '@moto-pos/core/tokens.css';
```

Or use the CSS file directly:

```html
<link rel="stylesheet" href="/node_modules/@moto-pos/core/dist/tokens/tokens.css">
```

## Theming

Override CSS custom properties to customize the appearance:

```css
:root {
  --moto-pos-color-primary: #your-brand-color;
  --moto-pos-radius-md: 4px; /* square corners */
}
```

See the [Theming Guide](/theming) for more details.

## Detailed Documentation

For complete API documentation with all tokens, see the [generated TypeDoc reference](/api-typedoc/modules/tokens.html).