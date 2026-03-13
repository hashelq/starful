import TUIApp from "./TUIApp.js";
import { ChatHistory, MessageInput } from "./TUIApp.js";

const app = new TUIApp({ title: "Starful TUI" });

function render(): void {
  const output = app.render();
  if (typeof output === 'object' && 'children' in output) {
    for (const line of (output as any).children) {
      console.log(line);
    }
  } else {
    console.log("Rendered UI");
  }
}

// Demo usage
console.log("Starful TUI Demo");
console.log("================\n");

app.updateInput("");
render();

setTimeout(() => {
  app.appendMessage("user", "Hello, how are you?");
  render();
}, 10);

setTimeout(() => {
  app.appendMessage("assistant", "I'm a terminal UI app running in your terminal.");
  render();
  console.log("\n[Tabs to switch panels]");
}, 50);

export default app;
export { ChatHistory, MessageInput };

