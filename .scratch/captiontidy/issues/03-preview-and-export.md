# 03: Preview and export a local batch

**What to build:** A static page imports one or more local SRT files, runs the pure cleanup path with batch-wide settings, aligns before/after cues, shows a text report, and downloads individual or all cleaned files.

**Blocked by:** 02: Merge flashing short cues.

**Status:** ready-for-agent

- [ ] The page works when opened directly from disk and makes no network requests.
- [ ] Default and configurable settings recalculate every imported file.
- [ ] Each file has an individual download, and batch export downloads all successful results.
- [ ] Empty, malformed, and read-failure states are understandable.

