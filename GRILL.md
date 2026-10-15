# CaptionTidy grill notes

The brief is unusually specific, but these are the decisions I would normally ask the owner to settle. The owner asked this run to proceed without waiting, so each question includes the assumption used for the MVP.

1. **What counts as one “character” for the line limit?**
   Assumption: count Unicode code points, ignore existing line breaks, and count spaces. This is predictable for Chinese and does not split surrogate pairs such as emoji.
2. **May a caption still exceed two lines?**
   Assumption: no. Text is reflowed into at most two lines. If the whole caption exceeds twice the configured limit, the second line keeps the remaining text rather than discarding words. The UI warns by marking that cue as over limit.
3. **How should punctuation influence wrapping?**
   Assumption: prefer a break immediately after Chinese sentence/comma punctuation within the first-line limit; if none exists, prefer whitespace; otherwise break at the limit.
4. **What does the merge threshold mean?**
   Assumption: merge a cue shorter than the configured duration in milliseconds with its immediately following cue, provided the time gap is no greater than that same threshold. Repeat forward so runs of short cues can collapse.
5. **What timestamp should a merged cue use?**
   Assumption: preserve the first cue's start and the last merged cue's end. Caption text is joined with a space only when the boundary is not CJK/punctuation-friendly.
6. **Should overlapping captions merge?**
   Assumption: yes when the short-cue rule applies; a negative gap is treated as zero. This avoids producing a backward interval.
7. **How strict should SRT parsing be?**
   Assumption: accept CRLF/LF, optional UTF-8 BOM, blank blocks, and missing/non-sequential numeric indices. Skip malformed blocks with a visible warning instead of aborting the whole file.
8. **How should batches export?**
   Assumption: each file gets its own `<name>.tidy.srt` download button. “Export all” triggers one browser download per file; no ZIP dependency is introduced.
9. **What belongs in the report?**
   Assumption: show source cue count, output cue count, changed cue count, merge count, line-break count, over-limit count, and skipped malformed blocks as plain text.
10. **Should users edit caption text in the preview?**
    Assumption: no. “左边改前右边改后” means before/after comparison, not an editor. Editing would be a fourth feature and is out of scope.
11. **What encodings are supported?**
    Assumption: UTF-8 only, using `File.text()`. Encoding detection would add complexity and unreliable heuristics.
12. **What file-size limits are needed?**
    Assumption: no artificial limit for MVP. Files are processed in memory; the README states that very large files depend on browser memory.
13. **What is the default merge threshold?**
    Assumption: 800 ms. It catches flash captions while leaving ordinary one-second cues alone.
14. **Should settings apply per file or to the batch?**
    Assumption: one pair of settings applies to every imported file. Changing either setting immediately recalculates the batch.
15. **Which browsers are targeted?**
    Assumption: current desktop Chrome, Edge, Firefox, and Safari with File API, Blob, and download-attribute support. The page must also work from `file://`.

