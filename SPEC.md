# CaptionTidy MVP specification

## Problem Statement

Short-video, course, and podcast editors already have automatically generated SRT files, but those captions often contain three or four cramped lines and awkward breaks on a vertical phone screen. They need a quick, private way to make the existing captions readable without uploading media or learning another editing suite.

## Solution

CaptionTidy is a static page opened directly from disk. A user selects one or more UTF-8 SRT files, applies a batch-wide line-length and short-caption merge setting, compares the original and tidied captions side by side, and downloads new SRT files. All work stays in the browser.

The single behavioral seam is `tidySrt(source, options)`. It returns serialized SRT, cue-level before/after data, warnings, and report counts. The UI supplies files and options and renders that result without duplicating caption rules.

## User Stories

1. As a short-video creator, I want to import several local SRT files, so that I can clean up a batch in one pass.
2. As a privacy-conscious editor, I want processing to stay offline, so that my unpublished captions never leave my computer.
3. As a vertical-video editor, I want to choose the maximum characters per line, so that captions fit my layout.
4. As a viewer, I want captions limited to two displayed lines, so that subtitles do not cover most of the video.
5. As a Chinese-language editor, I want breaks to favor natural punctuation, so that phrases remain easy to scan.
6. As an editor with auto-generated captions, I want flashing short cues merged with their following cues, so that viewers have time to read them.
7. As an editor, I want the merge threshold to be adjustable, so that I can match different speaking rhythms.
8. As an editor, I want original and processed cues aligned side by side, so that I can spot undesirable changes.
9. As an editor, I want malformed input called out without losing valid cues, so that one bad block does not waste the batch.
10. As an editor, I want a plain-language change report, so that I know how much the tool altered.
11. As an editor, I want one-click downloads, so that I can return the cleaned SRT files to my normal workflow.
12. As an editor, I want to export every imported file, so that batch use does not become repetitive.
13. As a user opening a local HTML file, I want the app to work without a server or installation, so that setup is effectively zero.
14. As a cautious user, I want over-limit results identified, so that exceptionally long cues are not silently presented as ideal.

## Implementation Decisions

- Ship plain HTML, CSS, and browser JavaScript with no build step, package manager, third-party dependency, backend, or network request.
- Keep parsing, merging, wrapping, serialization, and report calculation in a UMD-style pure JavaScript module that works in browsers and Node.
- Treat the character limit as Unicode code points. Existing caption line breaks are normalized to spaces before reflow.
- Wrap to at most two lines. Prefer a break after Chinese or common sentence punctuation at or before the limit, then whitespace, then the exact limit. Never discard overflow; exceptionally long second lines are reported as over limit.
- A cue whose duration is strictly less than the threshold may merge forward when the gap to the next cue is no greater than the threshold. Runs are evaluated repeatedly. Merged timing spans from the first start through the last end.
- Default to 14 characters per line and an 800 ms merge threshold. Valid UI ranges are 4–40 characters and 0–3000 ms.
- Parse UTF-8 SRT with LF or CRLF, optional BOM, optional numeric indices, and multiline text. Skip malformed blocks and report them.
- Give each file a preview and individual download. Batch export starts one `.tidy.srt` download per successfully parsed file.
- Render reports as selectable plain text. No charts, scoring, or content editing.
- Keep the interface compact, calm, and usable on desktop and narrow screens; the comparison becomes a stacked layout when necessary.

## Testing Decisions

- Use a dependency-free Node assertion script against the exported pure functions.
- Test public behavior and hand-written expected SRT/results, not helper implementation details.
- Cover long unpunctuated text, punctuation-priority wrapping, whitespace wrapping, short-cue merging, non-merging gaps, empty input, blank caption lines, CRLF/BOM input, malformed blocks, and serialization timing.
- Run the same script after every red/green cycle and again as the release gate.
- Manually verify opening `index.html` from `file://`, selecting sample files, changing both controls, comparing previews, and creating downloads.

## Out of Scope

- Speech-to-text, translation, AI or API calls, network requests, analytics, accounts, cloud storage, and collaboration.
- Video preview, burning subtitles into video, ffmpeg, audio handling, and format conversion beyond SRT-to-SRT.
- Caption text editing, timing editing, ZIP export, automatic encoding detection, and styling/ASS output.

## Further Notes

- The source files must be content the user has permission to process.
- The second line can exceed the configured limit when a single cue is longer than twice the limit. Preserving text is safer than truncating it; the report makes this visible.
- Questions and working assumptions are recorded in `GRILL.md` and will be copied into `DELIVERY.md`.
