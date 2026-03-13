import TUIApp from "./TUIApp.js";

console.log("Testing TUI Components\n");

// Simulate user input and rendering
function simulateChat(): void {
  console.log("\n=== Chat Simulation ===\n");
  
  const app = new TUIApp({ title: "Starful TUI Demo" });
  // Initial render
  app.render();
  
  // Simulate messages
  setTimeout(() => {
    app.render();
    console.log("\nSimulated: Press Enter to continue testing...");
  }, 50);
}
simulateChat();
