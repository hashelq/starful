# OpenTUI Tips & Tricks

## Listening to Terminal Resize

To listen for terminal resize events, use the **global renderer**, not `renderer.root`:

```typescript
// ✅ Correct - listen on renderer
renderer.on("resize", () => {
  console.log("Terminal resized!");
});

// ❌ Wrong - renderer.root doesn't emit "resize"
renderer.root.on("resize", () => {});
```

## Getting Element Position

Access computed position directly on renderables (after first layout):

```typescript
const box = new BoxRenderable(renderer, {...});
// Access after layout
console.log(box.x, box.y);
```

## Element Size Change

Use `onSizeChange` callback in renderable options:

```typescript
const box = new BoxRenderable(renderer, {
  onSizeChange: () => {
    console.log("Size changed!");
  }
});
```
