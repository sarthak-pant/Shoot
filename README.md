# Shoot

A browser aim trainer I built because I wanted to get better at flicking onto targets fast, and every trainer I tried online either had ads plastered everywhere or felt clunky to use. So I made my own.

No downloads, no accounts, no backend. Open the page, pick a mode, start clicking.

## What's actually in it

Five modes, each testing a different piece of aim:

- **Classic** - standard targets, the baseline mode
- **Precision** - same idea but the targets are tiny, so misses hurt more
- **Speed** - multiple targets on screen at once, forces you to move fast
- **Reaction** - fifteen targets, one at a time, tracks how quickly you click each one
- **Tracking** - targets that strafe, float, or actively chase your cursor

Every mode has its own accent color and its own scoring rules under the hood. Hit a combo streak and your points scale up. Miss, and the screen shakes a little and the combo resets. Small stuff, but it makes hitting a target feel like it matters.

Your personal bests get saved right in the browser, so they'll be there next time you open the page. Nothing leaves your machine.

## How I built it

Just HTML, CSS, and vanilla JavaScript. No frameworks, no build step, no npm install. That was a deliberate choice. I wanted the whole thing readable top to bottom without wading through node_modules.

The game runs on a canvas with a `requestAnimationFrame` loop handling movement, spawning, and rendering every frame. Sound is generated live through the Web Audio API, so there are zero audio files sitting in the repo. Every hit, miss, and combo sound is just a synthesized tone.

Design-wise I went with a dark, warm color palette instead of the usual cold neon-blue FPS aesthetic. Felt more like a shooting range than a sci-fi menu.

## Running it

Clone it, open `index.html` in a browser, done. There's no server involved. If your browser is picky about local files, spin up any static file server (`python -m http.server` works fine) and point it at the folder. Or u can just go to: https://sarthak-pant.github.io/Shoot/ and directly play there.

## What I learned building this

Mostly that small state bugs are sneaky. A typo in one config object doesn't crash anything. It just quietly breaks one mode, and you don't find out until you're actually playing through it and notice reaction mode refuses to end after fifteen hits. Nothing in the console warns you. The game just keeps running, wrong.

That's the tradeoff of a pure JS project with no type checking: fast to write, easy to shoot yourself in the foot.

## Ideas I might come back to

- Leaderboards, though that means a backend, which kind of breaks the "no server" thing I like about this
- More target types for tracking mode
- A settings option to tweak individual mode difficulty instead of just global round duration

For now it does what I wanted it to do: give me somewhere to warm up before actually playing.
