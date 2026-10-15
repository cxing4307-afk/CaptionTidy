(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.CaptionTidy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TIMESTAMP = /^(\d{2,}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2,}):(\d{2}):(\d{2})[,.](\d{3})$/;

  function timestampToMs(parts, offset) {
    const hours = Number(parts[offset]);
    const minutes = Number(parts[offset + 1]);
    const seconds = Number(parts[offset + 2]);
    const milliseconds = Number(parts[offset + 3]);
    if (minutes > 59 || seconds > 59) return null;
    return (((hours * 60 + minutes) * 60) + seconds) * 1000 + milliseconds;
  }

  function parseSrt(source) {
    const normalized = String(source ?? '')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .trim();

    if (!normalized) return { cues: [], warnings: [] };

    const cues = [];
    const warnings = [];
    const blocks = normalized.split(/\n{2,}/);

    blocks.forEach((block, blockIndex) => {
      const lines = block.split('\n');
      if (/^\d+$/.test(lines[0].trim())) lines.shift();

      const match = (lines.shift() || '').trim().match(TIMESTAMP);
      const startMs = match ? timestampToMs(match, 1) : null;
      const endMs = match ? timestampToMs(match, 5) : null;
      const text = lines.join('\n').trim();

      if (!match || startMs === null || endMs === null || endMs < startMs || !text) {
        warnings.push(`Skipped malformed block ${blockIndex + 1}.`);
        return;
      }

      cues.push({ startMs, endMs, text });
    });

    return { cues, warnings };
  }

  function formatTimestamp(milliseconds) {
    const safe = Math.max(0, Math.round(milliseconds));
    const hours = Math.floor(safe / 3600000);
    const minutes = Math.floor((safe % 3600000) / 60000);
    const seconds = Math.floor((safe % 60000) / 1000);
    const millis = safe % 1000;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  function serializeSrt(cues) {
    if (!cues.length) return '';
    return cues.map((cue, index) => (
      `${index + 1}\n${formatTimestamp(cue.startMs)} --> ${formatTimestamp(cue.endMs)}\n${cue.text}`
    )).join('\n\n') + '\n';
  }

  function wrapText(text, maxChars) {
    const limit = Math.max(1, Math.floor(Number(maxChars) || 1));
    const normalized = String(text ?? '').replace(/\s+/gu, ' ').trim();
    const chars = Array.from(normalized);

    if (chars.length <= limit) {
      return { text: normalized, breakCount: 0, overLimit: false };
    }

    let splitAt = -1;
    const punctuation = /[，。！？；：、,.!?;:]/u;
    for (let index = Math.min(limit, chars.length) - 1; index >= 0; index -= 1) {
      if (punctuation.test(chars[index])) {
        splitAt = index + 1;
        break;
      }
    }

    if (splitAt < 1) {
      for (let index = Math.min(limit, chars.length - 1); index >= 0; index -= 1) {
        if (/\s/u.test(chars[index])) {
          splitAt = index;
          break;
        }
      }
    }

    if (splitAt < 1) splitAt = Math.min(limit, chars.length);

    const first = chars.slice(0, splitAt).join('').trimEnd();
    const second = chars.slice(splitAt).join('').trimStart();
    return {
      text: `${first}\n${second}`,
      breakCount: 1,
      overLimit: Array.from(second).length > limit,
    };
  }

  function joinCueText(left, right) {
    const a = left.replace(/\s+/gu, ' ').trim();
    const b = right.replace(/\s+/gu, ' ').trim();
    const needsSpace = /[A-Za-z0-9]$/u.test(a) && /^[A-Za-z0-9]/u.test(b);
    return `${a}${needsSpace ? ' ' : ''}${b}`;
  }

  function tidySrt(source, options) {
    const settings = options || {};
    const maxChars = Math.min(40, Math.max(1, Math.floor(Number(settings.maxChars) || 14)));
    const mergeThresholdMs = Math.min(3000, Math.max(0, Math.floor(Number(settings.mergeThresholdMs) || 0)));
    const parsed = parseSrt(source);
    const merged = [];

    for (const cue of parsed.cues) {
      const current = {
        startMs: cue.startMs,
        endMs: cue.endMs,
        text: cue.text,
        sourceTexts: [cue.text],
      };
      const previous = merged[merged.length - 1];

      if (previous && mergeThresholdMs > 0) {
        const previousDuration = previous.endMs - previous.startMs;
        const gap = Math.max(0, current.startMs - previous.endMs);
        if (previousDuration < mergeThresholdMs && gap <= mergeThresholdMs) {
          previous.endMs = Math.max(previous.endMs, current.endMs);
          previous.text = joinCueText(previous.text, current.text);
          previous.sourceTexts.push(current.text);
          continue;
        }
      }

      merged.push(current);
    }

    let changedCueCount = 0;
    let lineBreakCount = 0;
    let overLimitCount = 0;
    const cues = merged.map((cue) => {
      const wrapped = wrapText(cue.text, maxChars);
      const changed = cue.sourceTexts.length > 1 || wrapped.text !== cue.text.replace(/\s+/gu, ' ').trim();
      if (changed) changedCueCount += 1;
      lineBreakCount += wrapped.breakCount;
      if (wrapped.overLimit) overLimitCount += 1;
      return {
        startMs: cue.startMs,
        endMs: cue.endMs,
        beforeText: cue.sourceTexts.join('\n'),
        text: wrapped.text,
        changed,
        overLimit: wrapped.overLimit,
      };
    });

    const outputCues = cues.map(({ startMs, endMs, text }) => ({ startMs, endMs, text }));
    return {
      srt: serializeSrt(outputCues),
      cues,
      warnings: parsed.warnings,
      report: {
        sourceCueCount: parsed.cues.length,
        outputCueCount: cues.length,
        changedCueCount,
        mergeCount: parsed.cues.length - cues.length,
        lineBreakCount,
        overLimitCount,
        skippedBlockCount: parsed.warnings.length,
      },
    };
  }

  function tidyFilename(filename) {
    const stem = String(filename || 'captions').replace(/\.srt$/iu, '');
    return `${stem}.tidy.srt`;
  }

  return { parseSrt, formatTimestamp, serializeSrt, wrapText, tidySrt, tidyFilename };
});
