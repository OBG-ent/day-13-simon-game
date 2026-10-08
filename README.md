# 🎮 Simon Says — TypeScript Edition

**The classic 4-pad memory game, rebuilt from scratch in TypeScript.**

Watch the pads light up and sing, then repeat the sequence back. Each round adds one more step — miss one and it's game over. Best score is saved between visits.

## ✨ Features

- Fully typed TypeScript game engine (`src/game.ts`) with strict mode on
- Game logic separated from the UI — the engine talks only through callbacks
- Four glowing pads with classic Simon tones (Web Audio, no audio files needed)
- Persistent best score via `localStorage`
- Keyboard play: `G` `R` `Y` `B`
- Compiled `dist/*.js` included so it runs immediately; `tsconfig.json` included so you can rebuild it

## 🚀 Run it in 30 seconds

Just open `index.html` in a browser — the compiled JavaScript in `dist/` runs as-is.

Want to rebuild from the TypeScript sources?

```bash
# 1. Install the TypeScript compiler
npm install -g typescript

# 2. Compile (reads tsconfig.json, outputs to dist/)
tsc

# 3. Open index.html in a browser
```

## 🧠 What I practiced

- TypeScript types: unions (`PadColor`), interfaces, `Record`, generics-free class design
- `strict` mode, `noUnusedLocals`, and clean compiler config (`tsconfig.json`)
- Separating game rules from DOM rendering with a callback interface
- `async/await` with promise-based delays for the playback sequence
- Web Audio API for synthesized sound
- `localStorage` persistence

## 📁 Files

| File            | What it is                              |
| --------------- | --------------------------------------- |
| `src/game.ts`   | Typed game engine (rules, sequence, score) |
| `src/main.ts`   | DOM wiring, pads, sound, keyboard input |
| `tsconfig.json` | Compiler configuration                  |
| `dist/*.js`     | Compiled output — this is what the browser runs |

---

Day 13 of my daily coding journey — two projects shipped every day. ⭐ Star the repo if you like the streak!
