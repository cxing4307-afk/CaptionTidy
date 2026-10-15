'use strict';

const assert = require('node:assert/strict');
const {
  parseSrt,
  formatTimestamp,
  serializeSrt,
  wrapText,
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
