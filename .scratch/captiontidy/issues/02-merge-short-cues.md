# 02: Merge flashing short cues

**What to build:** The same pure cleanup path can merge short adjacent cues using a configurable threshold while preserving the complete text and outer timing range.

**Blocked by:** 01: Parse and wrap one SRT.

**Status:** ready-for-agent

- [ ] A short cue merges forward when both duration and gap satisfy the threshold rule.
- [ ] Long cues and short cues separated by a large gap remain separate.
- [ ] The report distinguishes merges, changed cues, breaks, skipped blocks, and over-limit results.

