# Future Improvements

## Refactor Themed Renderables

### Current Design

Currently uses `subscribeToThemeChanges()` helper function:

```typescript
subscribeToThemeChanges([
  { renderable: myText, prop: 'fg', colorKey: 'userText' },
  { renderable: myBox, prop: 'backgroundColor', colorKey: 'surface' },
]);
```

**Pros:**
- Simple, works with any renderable
- No wrapper classes needed

**Cons:**
- Verbose for complex components
- No type safety on property names
- Scattered subscriptions throughout code

---

### Proposed Design: ThemedRenderable<T> Wrapper

#### Core Wrapper Class

```typescript
class ThemedRenderable<T extends Renderable> {
  private _renderable: T;
  private _colorMap: Map<keyof T, keyof ColorPalette> = new Map();
  
  constructor(renderable: T) {
    this._renderable = renderable;
    
    // Subscribe once to theme changes
    themeService.onThemeChange((payload) => {
      this._applyColors(payload.colors as ColorPalette);
    });
  }
  
  // Register color mappings - chainable
  map<K extends keyof T>(prop: K, colorKey: keyof ColorPalette): this {
    this._colorMap.set(prop, colorKey);
    // Apply immediately on mapping
    this._renderable[prop] = getPalette()[colorKey];
    return this;
  }
  
  private _applyColors(palette: ColorPalette): void {
    for (const [prop, colorKey] of this._colorMap) {
      this._renderable[prop] = palette[colorKey as keyof ColorPalette];
    }
    this._renderable._ctx?.requestRender?.();
  }
  
  // Expose underlying renderable
  get raw() { return this._renderable; }
  
  // Forward add/remove methods for Box variants
  add(child: Renderable): this {
    this._renderable.add(child);
    return this;
  }
}
```

#### Usage Examples

```typescript
// Simple text - chainable and type-safe
const text = new ThemedRenderable(
  new TextRenderable(renderer, { content: "Hello" })
).map('fg', 'userText');

// Input with multiple color props
const input = new ThemedRenderable(
  new InputRenderable(renderer, { placeholder: "Type..." })
).map('textColor', 'inputText')
 .map('placeholderColor', 'placeholderText');

// Box with background and border
const box = new ThemedRenderable(
  new BoxRenderable(renderer, { width: "100%" })
).map('backgroundColor', 'surface')
 .map('borderColor', 'border');

// Add to parent via .raw or .add()
mainContainer.add(box.raw);
```

#### Factory Helpers (Optional)

```typescript
// Convenience helpers for common patterns
function themedText(renderer, content: string, fg?: keyof ColorPalette) {
  return new ThemedRenderable(
    new TextRenderable(renderer, { content, fg: getPalette()[fg || 'text'] })
  ).map('fg', fg || 'text');
}

function themedInput(renderer, options) {
  const input = new InputRenderable(renderer, {
    textColor: getPalette().inputText,
    placeholderColor: getPalette().placeholderText,
    ...options
  });
  
  return new ThemedRenderable(input)
    .map('textColor', 'inputText')
    .map('placeholderColor', 'placeholderText');
}
```

---

### Migration Path

1. Create `ThemedRenderable` class in `theme.ts`
2. Refactor components one by one:
   - `CodeBlock.ts` - wrap internal renderables
   - `FoldableBox.ts` - wrap header text
   - `NotificationsOverlay.ts` - wrap notification elements
   - `main.ts` - wrap input, banner, messages
3. Remove `subscribeToThemeChanges()` helper once migration complete

### Benefits

- **Type-safe**: `map('fg', 'userText')` validates `fg` exists on T
- **Chainable**: `.map().map()` fluent API
- **Self-contained**: Subscription lives on the wrapper instance
- **Cleaner components**: Less boilerplate in constructors
