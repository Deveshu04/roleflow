# Roleflow demo video

[Remotion](https://www.remotion.dev) source for the product demo in [`docs/media/`](../docs/media):
`roleflow-demo.mp4` (1920×1080, 30 fps), the README GIF and the poster frame.

This is a separate npm project; nothing here is part of the app build.

## Preview

```bash
cd video
npm install
npx remotion studio
```

Compositions:

| ID | What |
| --- | --- |
| `RoleflowDemo` | The full video |
| `RoleflowHighlight` | ~14 s cut used for the README GIF |
| `RoleflowPoster` | Thumbnail still |
| `Scenes/*` | Each scene on its own timeline |

## Render

```bash
# Full video: render a high-quality master, then compress it to stay under GitHub's 10 MB upload limit.
npx remotion render RoleflowDemo out/master.mp4 --codec=h264 --crf=14
npx remotion ffmpeg -y -i out/master.mp4 -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -an ../docs/media/roleflow-demo.mp4

# GIF: render the highlight cut, then palette-encode at 960 px / 12 fps.
npx remotion render RoleflowHighlight out/highlight.mp4 --codec=h264 --crf=14
npx remotion ffmpeg -y -i out/highlight.mp4 -vf "scale=960:-1:flags=lanczos:in_color_matrix=bt709:in_range=tv,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" -r 12 ../docs/media/roleflow-demo.gif

# Poster (palettized to roughly halve the PNG size)
npx remotion still RoleflowPoster out/poster.png
npx remotion ffmpeg -y -i out/poster.png -vf "split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse=dither=sierra2_4a" ../docs/media/roleflow-demo-poster.png
```

`remotion.config.ts` caps rendering at 2 parallel tabs for low-memory machines; pass `--concurrency=<n>` to go faster.

## Assets

- `public/ui/` — 2× screenshots of a sandboxed Roleflow instance with a fictional candidate (Aarav Mehta, `example.com` email). `live-*.jpg` are frames from the agent's own browser tab during a real run on a public Greenhouse posting; the run was stopped at the review step and nothing was submitted.
- `public/hero.mp4`, `public/hero-poster.jpg` — the landing page's background video, re-encoded to 720p H.264 (≈ 1 MB), and one frame of it for the poster.
- `public/fonts/` — Inter and Instrument Serif (italic), the same files the landing page uses.

## License

The compositions here are MIT like the rest of the repo, but Remotion itself is **not** MIT. It is free for individuals, non-profits and for-profit companies with up to 3 employees; larger companies need a Remotion company license. See [remotion.dev/license](https://www.remotion.dev/license) for the exact terms.
