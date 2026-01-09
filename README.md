# Bounce Game (Impact-style block breaker)

Browser-based 2D block-breaking game: move the paddle left/right, bounce the ball, break blocks, clear levels.

## Run
Because browsers restrict ES module loading from `file://`, run a tiny static server:

- macOS/Linux (script):

```bash
chmod +x ./serve.sh
./serve.sh
```

- Python:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` and click the canvas to focus it.

## Controls
- Move: A/D or Left/Right arrows (mouse movement also works when focused)
- Launch: Space
- Pause: P
- Restart: R


