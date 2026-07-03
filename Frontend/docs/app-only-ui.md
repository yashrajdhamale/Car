# App-Only UI Theming System

This document outlines the architecture and implementation details for the app-only UI theming system, which allows for platform-specific styling in the Capacitor-based mobile app while keeping the web version unchanged.

## Overview

The app uses a combination of CSS classes and conditional imports to apply different styles based on the runtime environment (web or native app). This ensures a consistent codebase while allowing for platform-specific UI/UX optimizations.

## How It Works

1. **Platform Detection**
   - The `isNativeApp` flag from `src/utils/platform.ts` detects if the app is running in a native mobile environment.
   - The `initializePlatformStyles()` function adds appropriate CSS classes to the document body.

2. **CSS Architecture**
   - **Web Styles**: Located in `src/styles/web/web-theme.css`
   - **App Styles**: Located in `src/styles/app/app-theme.css`
   - Both sets of styles use the same CSS variables but with different values for each platform.

3. **Conditional Styling**
   - Web styles are always loaded
   - App styles are only loaded in the native app environment
   - Styles are scoped using the `.app-mode` and `.web-mode` classes

## Folder Structure

```
src/
  styles/
    app/                 # App-only styles
      app-theme.css      # App-specific theme overrides
    web/                 # Web-only styles
      web-theme.css      # Web-specific theme overrides
  utils/
    platform.ts          # Platform detection utilities
```

## How to Use

### 1. Adding New Styles

1. **For App-Only Styles**
   Add your styles to `src/styles/app/app-theme.css` with the `.app-mode` prefix:
   ```css
   body.app-mode .your-component {
     /* App-specific styles */
   }
   ```

2. **For Web-Only Styles**
   Add your styles to `src/styles/web/web-theme.css` with the `.web-mode` prefix:
   ```css
   body.web-mode .your-component {
     /* Web-specific styles */
   }
   ```

### 2. Using Platform-Specific Components

```jsx
import { isNativeApp } from '../utils/platform';

function MyComponent() {
  return (
    <div className={`my-component ${isNativeApp ? 'app-style' : 'web-style'}`}>
      {isNativeApp ? 'App Version' : 'Web Version'}
    </div>
  );
}
```

### 3. Platform-Safe Styling

Use CSS variables for consistent theming:

```css
.my-component {
  padding: 1rem;
  border-radius: var(--border-radius, 8px);
  background: var(--background-color, white);
  color: var(--text-color, #333);
}
```

## Best Practices

1. **Use CSS Variables**
   - Define theme variables in the appropriate theme file
   - Use them consistently throughout the app

2. **Keep Platform Differences Minimal**
   - Only override what's necessary
   - Share as much code as possible between platforms

3. **Test on Both Platforms**
   - Always test changes on both web and native platforms
   - Pay attention to platform-specific behaviors (e.g., safe areas on iOS)

4. **Document Platform-Specific Code**
   - Add comments explaining why platform-specific code is needed
   - Reference platform guidelines (Material Design, HIG) when applicable

## Maintenance

1. **Adding New Theme Variables**
   - Add new variables to both theme files
   - Document their purpose and usage

2. **Updating Dependencies**
   - When updating Capacitor or related packages, verify platform detection still works
   - Check for new platform-specific features or requirements

3. **Performance**
   - Keep app-specific styles minimal
   - Use CSS containment where possible
   - Avoid expensive selectors in app-mode

## Troubleshooting

### Styles Not Applying in App
1. Verify `isNativeApp` is `true` in the app
2. Check that `app-theme.css` is being imported
3. Look for CSS specificity issues

### Styles Leaking Between Platforms
1. Ensure all app-specific styles use the `.app-mode` prefix
2. Check for missing `body` selectors in theme files
3. Verify no styles are being loaded conditionally without proper scoping

### Performance Issues
1. Check for expensive CSS properties in app-mode
2. Look for unnecessary style recalculations
3. Verify CSS containment is being used effectively
