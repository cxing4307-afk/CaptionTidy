'use strict';

const assert = require('node:assert/strict');
const {
  parseSrt,
  formatTimestamp,
  serializeSrt,
  wrapText,
  tidySrt,
  tidyFilename,
} = require('./tidy.js');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test('parses BOM, CRLF, multiline text, and non-sequential indices', () => {
  const source = '\uFEFF7\r\n00:00:01,250 --> 00:00:03,500\r\n第一行\r\n第二行\r\n\r\n12\r\n00:00:04,000 --> 00:00:05,000\r\nDone';
  const result = parseSrt(source);

  assert.deepEqual(result.cues, [
    { startMs: 1250, endMs: 3500, text: '第一行\n第二行' },
    { startMs: 4000, endMs: 5000, text: 'Done' },
  ]);
  assert.deepEqual(result.warnings, []);
});

test('returns no cues for whitespace-only input', () => {
  assert.deepEqual(parseSrt('\n \r\n'), { cues: [], warnings: [] });
});

test('skips malformed blocks and reports their block numbers', () => {
  const source = '1\nnot a timestamp\nbroken\n\n2\n00:00:02,000 --> 00:00:03,000\nvalid';
  const result = parseSrt(source);

  assert.deepEqual(result.cues, [
    { startMs: 2000, endMs: 3000, text: 'valid' },
  ]);
  assert.deepEqual(result.warnings, ['Skipped malformed block 1.']);
});

test('formats timestamps without rolling errors', () => {
  assert.equal(formatTimestamp(3723004), '01:02:03,004');
});

test('serializes cues with fresh sequential indices', () => {
  const result = serializeSrt([
    { startMs: 0, endMs: 1250, text: 'one' },
    { startMs: 2000, endMs: 3000, text: 'two\nlines' },
  ]);

  assert.equal(result, '1\n00:00:00,000 --> 00:00:01,250\none\n\n2\n00:00:02,000 --> 00:00:03,000\ntwo\nlines\n');
});

test('wraps after Chinese punctuation when it fits the first line', () => {
  assert.deepEqual(wrapText('今天下雨，记得带伞回家', 7), {
    text: '今天下雨，\n记得带伞回家',
    breakCount: 1,
    overLimit: false,
  });
});

test('falls back to a word boundary', () => {
  assert.deepEqual(wrapText('hello bright world', 12), {
    text: 'hello bright\nworld',
    breakCount: 1,
    overLimit: false,
  });
});

test('hard-wraps unpunctuated text without losing characters', () => {
  assert.deepEqual(wrapText('一二三四五六七八九十甲乙', 6), {
    text: '一二三四五六\n七八九十甲乙',
    breakCount: 1,
    overLimit: false,
  });
});

test('normalizes existing blank lines before wrapping', () => {
  assert.equal(wrapText('keep\n\nthis tidy', 9).text, 'keep this\ntidy');
});

test('keeps overflow on the second line and reports it', () => {
  const result = wrapText('一二三四五六七八九十甲乙丙丁', 5);
  assert.equal(result.text, '一二三四五\n六七八九十甲乙丙丁');
  assert.equal(result.overLimit, true);
});

test('merges a short cue forward and preserves outer timing', () => {
  const source = '1\n00:00:00,000 --> 00:00:00,500\n你好\n\n2\n00:00:00,650 --> 00:00:02,000\n世界';
  const result = tidySrt(source, { maxChars: 14, mergeThresholdMs: 800 });

  assert.equal(result.srt, '1\n00:00:00,000 --> 00:00:02,000\n你好世界\n');
  assert.equal(result.cues[0].beforeText, '你好\n世界');
  assert.equal(result.report.mergeCount, 1);
  assert.equal(result.report.changedCueCount, 1);
});

test('repeats merging while the combined cue remains short', () => {
  const source = '1\n00:00:00,000 --> 00:00:00,300\n一\n\n2\n00:00:00,400 --> 00:00:00,700\n二\n\n3\n00:00:00,800 --> 00:00:02,000\n三';
  const result = tidySrt(source, { maxChars: 14, mergeThresholdMs: 800 });

  assert.equal(result.report.outputCueCount, 1);
  assert.equal(result.report.mergeCount, 2);
  assert.match(result.srt, /一二/);
});

test('does not merge across a gap larger than the threshold', () => {
  const source = '1\n00:00:00,000 --> 00:00:00,400\na\n\n2\n00:00:02,000 --> 00:00:03,000\nb';
  const result = tidySrt(source, { maxChars: 14, mergeThresholdMs: 800 });
  assert.equal(result.report.outputCueCount, 2);
  assert.equal(result.report.mergeCount, 0);
});

test('allows merging to be disabled with a zero threshold', () => {
  const source = '1\n00:00:00,000 --> 00:00:00,100\na\n\n2\n00:00:00,100 --> 00:00:01,000\nb';
  assert.equal(tidySrt(source, { maxChars: 14, mergeThresholdMs: 0 }).report.outputCueCount, 2);
});

test('reports wrapping, overflow, and malformed blocks', () => {
  const source = 'bad\nblock\n\n2\n00:00:01,000 --> 00:00:03,000\n一二三四五六七八九十甲乙丙丁';
  const result = tidySrt(source, { maxChars: 5, mergeThresholdMs: 0 });

  assert.deepEqual(result.report, {
    sourceCueCount: 1,
    outputCueCount: 1,
    changedCueCount: 1,
    mergeCount: 0,
    lineBreakCount: 1,
    overLimitCount: 1,
    skippedBlockCount: 1,
  });
  assert.deepEqual(result.warnings, ['Skipped malformed block 1.']);
});

test('adds the tidy suffix without duplicating the SRT extension', () => {
  assert.equal(tidyFilename('clip.srt'), 'clip.tidy.srt');
  assert.equal(tidyFilename('lesson.v2.SRT'), 'lesson.v2.tidy.srt');
  assert.equal(tidyFilename('captions'), 'captions.tidy.srt');
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error.stack);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(`\n${passed}/${tests.length} tests passed`);
}
