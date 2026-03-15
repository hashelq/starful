# Starful

An AI-powered terminal IDE / Chat interface built with OpenTUI.

## Features

- **AI Chat Interface** - Chat with local Ollama models directly in your terminal
- **Prompt History** - Navigate previous prompts with Up/Down arrows, search with incremental filtering
- **Command Palette** - Press `Ctrl+P` to access commands
- **Theme Support** - Multiple color themes (catppuccin, gruvbox, monokai, nord, solarized, dracula)
- **Centered Mode** - Optional centered layout for better readability
- **Sidebar Animations** - 80+ ASCII/Unicode animations in the sidebar including:
  - Nature: snow, rain, forest, galaxy, tornado, volcano, aurora
  - Tech/Cyber: matrix, neural, data, wifi, laser, sonar
  - Retro/Gaming: tetris, snake, asteroids, breakout, spaceinvader
  - Abstract: pulse, wave, vortex, spiral, fractal

## Requirements

- [Bun](https://bun.sh) - JavaScript runtime
- [Ollama](https://ollama.ai) - Local LLM inference (optional, works with mock client)

## Installation

```bash
bun install
```

## Configuration

Configuration is stored in `~/.starful/ui.json`:

```json
{
  "theme": "catppuccin",
  "centered": false,
  "centeredWidth": 90
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | string | `"catppuccin"` | Color theme |
| `centered` | boolean | `false` | Enable centered layout |
| `centeredWidth` | number | `90` | Width in characters for centered mode |

### Available Themes

- catppuccin
- gruvbox
- monokai
- nord
- solarized
- dracula

## Usage

```bash
bun run src/index.ts
```

Or build and run the TUI:

```bash
# The TUI application runs from src/tui/main.ts
```

## Controls

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate prompt history |
| `Ctrl+P` | Open command palette |
| `Ctrl+C` | Cancel generation / Exit |
| `Ctrl+D` | Exit (when input empty) |
| `Escape` | Exit search mode |

## Commands

Access via `Ctrl+P`:

- `/clear` - Clear chat history
- `/revert` - Revert last file changes
- `/model` - Switch Ollama model
- `/theme` - Change color theme
- `/about` - About Starful

## Project Structure

```
src/
├── engine/           # Core engine
│   ├── commands/     # CLI commands
│   ├── llm/         # LLM integrations
│   ├── colors.ts    # Color theming
│   ├── config.ts    # Configuration
│   ├── theme.ts     # Theme management
│   └── ui-config.ts # UI settings
├── tui/              # Terminal UI
│   ├── main.ts      # Main application
│   └── components/  # UI components
│       ├── PromptInput.ts
│       ├── SearchSuggestionsOverlay.ts
│       ├── SideBar.ts
│       └── sidebar/ # Sidebar & animations
└── index.ts         # Entry point
```

## License

MIT
