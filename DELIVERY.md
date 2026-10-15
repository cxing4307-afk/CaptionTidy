# CaptionTidy delivery

## Repository

**Name:** CaptionTidy

**One-line summary:** Turn existing SRT files into calmer, two-line captions for vertical video — locally in the browser.

## Verification result

- `node test.js`: 18/18 assertions passed.
- `node --check tidy.js` and `node --check app.js`: passed.
- `node scripts/make-demo.js`: generated 3 output cues; every output cue has at most two explicit lines.
- `python3 scripts/render-demo.py`: rendered the checked-in 1440×760 PNG from the real sample and generated SRT.
- Offline-source scan: no `fetch`, XHR, WebSocket, HTTP URL, npm runtime dependency, ffmpeg, transcription, translation, AI, or API call in product code.
- Code review: Standards 0 hard findings; Spec 2 implementation findings. Both implementation findings were fixed test-first in `fbcd645` (documented defaults and option bounds).
- Browser manual check: not run in this environment because no Chrome/Chromium/Firefox/Safari executable is installed. See “Human review” below.

## Commits

1. `9a575f0` frame the caption cleanup
2. `3c37c21` map the first release
3. `24fde77` teach it to read srt
4. `a67112d` break lines where they breathe
5. `feec098` merge captions that flash by
6. `89cca05` name exports without surprises
7. `f053758` lay out the side by side view
8. `20d57fc` wire up local files and downloads
9. `468306a` add a demo made from real output
10. `2f8236e` show the four line squeeze clearly
11. `4d71004` write down how it actually works
12. `fbcd645` honor the defaults everywhere
13. Final handoff commit: this file and the release audit (its hash cannot be self-recorded inside the same commit).

## Demo material

- Original SRT: `sample/example.srt`
- Algorithm-generated SRT: `demo/example.tidy.srt`
- Real before/after image: `demo/before-after.png`
- Generator: `scripts/make-demo.js`
- Renderer: `scripts/render-demo.py`

The image was visually inspected after generation. It shows one caption as four source lines and the exact `tidy.js` result as two lines.

## Repository metadata suggestions

Description options:

1. Clean up local SRT files into readable two-line captions for vertical video.
2. An offline, dependency-free SRT line breaker for short-form video captions.
3. Batch tidy auto-generated SRT subtitles for phone screens, right in the browser.

Topics: `srt`, `subtitles`, `vertical-video`, `offline-first`, `javascript`

## Grill assumptions used

1. “Character” means a Unicode code point; spaces count and emoji are not split into UTF-16 halves.
2. Output has at most two explicit lines. Overflow is preserved on the second line and reported, never truncated.
3. Breaks prefer punctuation at or before the first-line limit, then whitespace, then the hard limit.
4. A cue shorter than the threshold may merge with the next cue when their gap is no greater than that threshold.
5. Merged timing uses the first start and final end; adjacent CJK text is joined without an artificial space.
6. Overlapping cues can merge under the same short-cue rule; a negative gap is treated as zero.
7. Parsing accepts BOM, CRLF/LF, optional/non-sequential indices, and multiline text; malformed blocks are skipped with warnings.
8. Batch export starts one normal `.tidy.srt` browser download per valid file; there is no ZIP.
9. The report includes source/output/changed counts, merges, inserted breaks, overflow, and skipped blocks.
10. Before/after is a comparison, not an editor; manual caption editing is outside the three-feature MVP.
11. Input is UTF-8 through `File.text()`; encoding detection is out of scope.
12. Files are processed in memory without an artificial size cap.
13. The default merge threshold is 800 ms; the default line limit is 14.
14. One setting pair applies to the whole batch and recalculates all loaded files.
15. The target is current desktop browsers with File API, Blob downloads, and `file://` script support.

The full question wording is retained in `GRILL.md`.

## Human review

- Open `index.html` by double-clicking it, import `sample/example.srt`, change both controls, compare the rows, and try individual plus batch downloads. This is the only release gate not executable in the current browser-less environment.
- Confirm that the 800 ms merge default matches the intended editing rhythm on a few real creator files; it is a product assumption, not a universal subtitle standard.
- Check batch downloads in the browsers you plan to support. Some browsers ask the user to allow multiple downloads.
- Review a legacy non-UTF-8 SRT if that input is common for the intended audience; the MVP intentionally supports UTF-8 only.

## Review notes

The standards reviewer also flagged two minor judgment calls: terse local names in `joinCueText` and a positional argument group in the one-off demo renderer. The local names were clarified during the important fix. The renderer was left simple because introducing a data model for two calls would add more machinery than clarity.
