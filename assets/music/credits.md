# Demo music credit

Music: **“Dream Culture” by Kevin MacLeod (incompetech.com)**.

- Official track: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046
- Official download: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dream%20Culture.mp3
- ISRC: USUAN1300046
- Licence: **Creative Commons Attribution 4.0 International (CC BY 4.0)** — https://creativecommons.org/licenses/by/4.0/
- Author's licensing information: https://incompetech.com/music/royalty-free/licenses/
- Source and licence checked on 2026-10-17 against the author's track page and official `pieces.json` catalog.
- Official MP3 SHA-256: `f12cbb52bd4b92bd6cf8a343645567c119627e9cbf98108a3eb6ac2cc275ee46`.

The music licence permits commercial use and editing with attribution. This is licensed copyrighted music, not a public-domain recording. The website's or product's other licences do not replace the music's CC BY 4.0 terms. No endorsement by the artist is implied.

## Adaptation in this demo

`assets/infrayard-demo-with-music.mp4` uses the opening 179.267 seconds of the instrumental, with a lower playback level (approximately −25 LUFS), a two-second fade in and a six-second fade out. Audio is encoded as stereo AAC at 48 kHz / 160 kb/s. There is no narration. Original H.264 video packets, timing and dimensions are preserved without re-encoding; `assets/final_hq_infrayard.mp4` remains the original.

The landing page displays the credit, source and licence link under the player. The MP4 also contains this information and the adaptation notice in its comment metadata. When sharing the video elsewhere, include the following credit in its description or accompanying material:

> Music: “Dream Culture” by Kevin MacLeod (incompetech.com). Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046. Licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Changes: excerpt, reduced volume, fade in and fade out.

## Rebuilding the audio mix

Download the official MP3 outside published assets, then run:

```sh
python scripts/mix-demo.py --music "/path/to/Dream Culture.mp3" --ffmpeg "/path/to/ffmpeg"
```

The optional script verifies the source music hash, measures volume, replaces the silent audio stream, preserves video packets, embeds attribution and validates the result. It is not part of the website build and does not publish anything. Tool binaries and the source MP3 are kept outside version control in `.local-tools/` during local preparation.
