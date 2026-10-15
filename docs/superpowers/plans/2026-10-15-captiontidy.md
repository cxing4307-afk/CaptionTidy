# CaptionTidy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-free offline page that turns existing SRT files into more readable two-line captions and exports the results with a change report.

**Architecture:** `tidy.js` is the single pure behavioral seam: parse, merge, wrap, serialize, and report in; deterministic result out. `app.js` owns browser-only File API, rendering, options, and Blob downloads. Static HTML/CSS provide the shell, while Node scripts test the algorithm and generate the real demo.

**Tech Stack:** HTML, CSS, JavaScript, Node built-in `assert`, Python Pillow only for the checked-in demo image generation step.

**Spec:** `SPEC.md`

## Global Constraints

- Directly opening `index.html` must work with no server.
- Use zero backend, build tools, third-party runtime dependencies, npm packages, and network requests.
- Defaults are 14 characters per line, at most two lines, and an 800 ms merge threshold.
- Do not implement transcription, translation, video burn-in, ffmpeg, AI/API calls, caption editing, or unrelated features.
- Keep 8–15 incremental commits, MIT license (2026, cxing4307-afk), and one or two honest TODOs.

## Review Focus

- A caption longer than twice the limit must keep all text and be counted over limit.
- Punctuation just beyond the first-line limit must not create an overlong first line.
- A run of short cues must not merge across a gap larger than the threshold.
- Empty and partly malformed files must not crash the batch UI.
- Repeated downloads after changing settings must use the recalculated output.

---

### Task 1: Parse and serialize SRT

**Files:** Create `test.js`; create `tidy.js`.

**Interfaces:** Produces `parseSrt(source)`, `formatTimestamp(milliseconds)`, and `serializeSrt(cues)`; consumes only strings.

- [ ] Write assertions for BOM/CRLF parsing, blank input, malformed blocks, multiline text, and timestamp serialization.
- [ ] Run `node test.js` and confirm failure because the exports do not exist.
- [ ] Implement the smallest parser and serializer satisfying those assertions.
- [ ] Run `node test.js` and confirm all parser tests pass.
- [ ] Commit with a short human message.

### Task 2: Wrap captions to two lines

**Files:** Modify `test.js`; modify `tidy.js`.

**Interfaces:** Consumes parsed cue text; produces `wrapText(text, maxChars)` returning `{ text, breakCount, overLimit }`.

- [ ] Add assertions for punctuation priority, whitespace fallback, an unpunctuated long line, existing blank lines, and text longer than twice the limit.
- [ ] Run the suite and confirm the new behavior fails for the expected missing export.
- [ ] Implement Unicode-code-point wrapping with punctuation, then whitespace, then hard-limit preference.
- [ ] Run the complete suite and confirm it passes.
- [ ] Commit.

### Task 3: Merge and tidy captions

**Files:** Modify `test.js`; modify `tidy.js`.

**Interfaces:** Consumes SRT plus `{ maxChars, mergeThresholdMs }`; produces `tidySrt(source, options)` with `srt`, `cues`, `report`, and `warnings`.

- [ ] Add assertions for one merge, a chained merge, a large-gap non-merge, disabled merging, sequential output, and report counts.
- [ ] Run the suite and verify the new assertions fail for missing behavior.
- [ ] Implement merge and the public orchestration function without mutating parsed cues.
- [ ] Run the complete suite and confirm it passes.
- [ ] Commit.

### Task 4: Import, compare, and download

**Files:** Create `index.html`; create `style.css`; create `app.js`; create `sample/example.srt`.

**Interfaces:** Consumes `window.CaptionTidy.tidySrt`; produces a local-file UI with batch state and Blob downloads.

- [ ] Add a tiny browser-independent test for output filename normalization and confirm it fails.
- [ ] Export and implement the filename helper in `tidy.js`; verify the suite passes.
- [ ] Build semantic controls, file import, reactive batch recalculation, aligned preview rows, plain-text report, and per-file/all downloads.
- [ ] Open the page from `file://` and manually exercise the sample, both settings, and downloads.
- [ ] Commit the UI in two coherent increments.

### Task 5: Real demo and project handoff

**Files:** Create `scripts/make-demo.js`; create `scripts/render-demo.py`; create `demo/example.tidy.srt`; create `demo/before-after.png`; create `README.md`; create `LICENSE`; create `.gitignore`; create `CHANGELOG.md`; create `DELIVERY.md`.

**Interfaces:** Scripts consume the checked-in sample and shipping `tidy.js`; artifacts and documentation are their visible result.

- [ ] Generate the cleaned sample through `tidy.js` and assert it contains no more than two lines per cue.
- [ ] Render the actual before/after strings into the comparison image using Pillow.
- [ ] Write the plain-language README, limitations, changelog, license, and delivery record.
- [ ] Run the full test suite, demo generator, syntax checks, offline-source scan, commit-count audit, and working-tree audit.
- [ ] Run the two-axis code-review skill from the first repository commit, fix Critical/Important findings test-first, and rerun verification.
- [ ] Commit the handoff and create local tag `v0.1.0`.

