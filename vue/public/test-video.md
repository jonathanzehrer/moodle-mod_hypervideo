# Test Video

This directory contains a small test video for local development and automated tests.

## How to create / regenerate

```bash
ffmpeg -y \
  -f lavfi -i testsrc=duration=30:size=1920x1080:rate=30 \
  -f lavfi -i sine=frequency=440:duration=30 \
  -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p \
  -c:a aac -b:a 64k -shortest \
  test-video.mp4
```

### What it produces

| Property   | Value                     |
|------------|---------------------------|
| Format     | MP4 (H.264 + AAC)         |
| Resolution | 1920×1080 (Full HD, 16:9) |
| Duration   | 30 seconds                |
| Framerate  | 30 fps                    |
| Video      | ffmpeg `testsrc` pattern (color bars + scrolling timecode) |
| Audio      | 440 Hz sine tone, 64 kbps |

### Customizing

- **Duration**: change `duration=30` in both `testsrc` and `sine` filters.
- **Resolution**: change `size=1920x1080` in the `testsrc` filter.
- **No audio**: remove the second `-f lavfi -i sine=...` line and the `-c:a` / `-shortest` flags.
- **Different video source**: replace `testsrc` with `testsrc2`, `rgbtestsrc`, `smptebars`, `color`, or a real file via `-i input.mp4`.