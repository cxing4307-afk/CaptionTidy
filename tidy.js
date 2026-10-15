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

  return { parseSrt, formatTimestamp, serializeSrt };
});
