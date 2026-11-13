# TK, Game Developer

One-page portfolio site. Plain HTML, CSS and a little JavaScript: no build step, no trackers, no external requests.

## Files

| Path | What |
|---|---|
| `index.html` | The page and all its text |
| `styles.css` | The look (dark, one condensed poster face from the device's own fonts, mono labels) |
| `main.js` | Scroll and swipe motion, the gallery, copy buttons, the motion switch |
| `assets/` | Trailer (`trailer.mp4`, H.264 + AAC, faststart), poster, pictures, favicon, social preview |
| `resume.pdf` | Optional. Drop it next to `index.html` and the Resume buttons appear by themselves |

## Preview locally

```bash
python -m http.server 8827
```

Then open http://localhost:8827/ .

## Notes

- Motion runs for every visitor; the "Motion: on/off" switch in the footer turns it off and remembers the choice.
- The trailer never autoplays and plays inline on phones (`playsinline`).
- Without JavaScript the page shows everything, just without motion.
