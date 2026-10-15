# 01: Parse and wrap one SRT

**What to build:** A pure, Node-testable path that accepts one SRT string and produces valid SRT with readable two-line captions, preferring punctuation and never dropping text.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] UTF-8 BOM, CRLF, blank input, malformed blocks, and multiline cues have defined behavior.
- [ ] Long, punctuation-rich, whitespace-rich, and unpunctuated captions are covered by direct assertions.
- [ ] Output uses sequential indices and valid SRT timestamps.

