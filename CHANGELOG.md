# Changelog

## [Unreleased]

**Phone-capable runtime input & mobile layout**
- Virtual gamepad now gates on **touch capability** (`pointer: coarse` / `hover: none`) instead of `md:hidden` — controls no longer vanish on large phones/tablets in landscape (≥768px viewports), and they only render during active battle (previously dead buttons hovered over the title/select screens)
- Fixed touch soft-locks: the React `PAUSED` / `GAME OVER` overlays swallowed taps aimed at the canvas — both are now tappable (`TAP OR PRESS ESC TO RESUME` / `TAP OR PRESS ENTER TO RETRY`) via a new `controlBus` command channel (React → Phaser) with shutdown-safe subscriptions
- Character select is finishable by touch: tap a portrait to select, **tap the selected turtle again (or the prompt) to infiltrate** — previously the run could only be started with `Enter`/`Space`
- On-screen ❚❚ pause button for touch; keyboard capture (`SPACE,ENTER,arrows…`) stops the page scrolling/zooming on gameplay keys; `Enter`/`Space` remain fully wired on every screen for hardware keyboards
- Fixed a scene-restart listener leak: `v-control` / `playerSpecial` / `playerDied` handlers stacked on every retry (stacked `playerDied` could drain multiple lives per death); handlers are now de-duplicated and released on shutdown, and held virtual buttons auto-release when the gamepad unmounts or the scene restarts
- Mobile layout: shell uses `100dvh` (no iOS URL-bar crop), HUD collapses to a compact header + mission strip on phones so the canvas fills the screen, gamepad respects notch safe areas, rotate-to-landscape hint, viewport locked against pinch/double-tap zoom with `overscroll-behavior`/`touch-action` guards and the canvas context menu disabled; multi-touch raised to 3 active pointers
- Title / cutscene prompts are device-aware (`TAP TO START`, `TAP OR PRESS SPACE TO CONTINUE`)

**Deployment**
- Fixed deployment-breaking asset paths: art moved from `src/assets/images/` to `public/assets/images/` (Phaser loads by runtime URL; Vite only bundles imported assets, so the game was broken in any production build)
- Relative asset base (`vite.base = './'`) so the build works on project sub-paths (GitHub Pages) too
- Added `vercel.json` + `api/cutscene.ts` serverless function for one-click Vercel deploys
- Added `npm run deploy:pages` (gh-pages) for GitHub Pages static hosting
- Extracted shared cutscene logic so the Express server and the Vercel function use the same code

**Over-the-top additions**
- 🍕 Pizza pickups: ~20% drop chance, heals 25 HP, +500 score, with glow/bob animation and chomp SFX
- 🎵 Procedural chiptune soundtrack: 96 BPM A-minor groove (kick/hats/bass/sparse lead) synthesized live via Web Audio — starts on first user interaction, toggled by the HUD mute button

## [1.0.0] — 2026-10-19

### Repository audit & enhancement pass

**Critical fixes**
- Fixed missing `foreground` texture — `MainScene` referenced a texture key that was never loaded (parallax layer silently failed); the foreground image is now loaded in `PreloadScene`
- Replaced the external `labs.phaser.io` rain texture with a procedurally generated texture — the game no longer depends on a network fetch at boot
- Fixed Express 5 SPA fallback (`app.get("*")` is invalid in Express 5) — now a middleware-based fallback with `/api/*` passthrough
- Fixed fragile `/api/cutscene` response parsing — JSON extraction is now wrapped safely, and malformed AI output falls back to scripted dialogue
- Fixed softlock in level transitions (`isTransitioning` could stay `true` forever if a wave cleared during init)

**Combat & gameplay**
- Rate-limited melee hits per enemy (one hit per swing instead of per-frame shredding) and added player i-frames + hurt blink
- Implemented the dormant jump system (2.5D Z-axis physics now wired to `X` / mobile JMP button)
- Added arcade lives system with respawn, game-over screen, and Enter-to-retry flow
- Added combo counter with floating combo popups
- Added pause (`Esc`/`P`, auto-pause on tab blur) with PAUSED overlay
- Capped cyber-drone steering velocity (was uncapped, causing twitchy flight)
- Persistent high score via `localStorage`

**HUD & presentation**
- Replaced the static fake HUD with a live React HUD synced from the game loop via a new typed `hudBus` pub/sub (health, lives, score, high score, special gauge, sector, combo, dialogue)
- HUD portrait/name/color now reflect the selected turtle
- Special gauge and mute button added to the HUD; `SoundSynth.toggleMute()` now wired up
- AI cutscene dialogue is mirrored into the HUD radio feed, with graceful fallback and retry messaging
- Mobile controls: placeholder "DRIVE" button wired to dodge roll, added JUMP button, fixed sticky touch states (pointer leave/cancel now release buttons)

**Pipeline & hygiene**
- `index.html`: proper title, meta description, theme-color, favicon, retro fonts (Press Start 2P + JetBrains Mono)
- `package.json`: renamed from `react-example`, added description/scripts (`typecheck`, `preview`), removed duplicate `vite` entry, dropped unused `motion` and `autoprefixer` deps
- Removed the `process.env.GEMINI_API_KEY` injection into the client bundle (unused; security anti-pattern)
- `server.ts`: configurable `PORT`/`GEMINI_MODEL`, request validation, input sanitization, lazy Gemini client, `/api/health` endpoint, security headers + CSP in production, `x-powered-by` disabled
- Renamed misleading `SCALES` constant to `SCENES` and removed the nonexistent `UIScene` entry
- Added typed `TurtleCharacter`/`DialogueLine` models (`src/game/types.ts`)
- Pruned ~17 MB of superseded duplicate art iterations; organized per-character portraits into `src/assets/images/characters/`
- Documented the JPEG-in-PNG asset quirk and the edge flood-fill alpha keying strategy in `PreloadScene`

**Docs**
- Full GitHub-style `README.md` (features, controls, architecture, API reference, roadmap)
- Added `CHANGELOG.md` and `LICENSE` (MIT) with fan-project disclaimer
