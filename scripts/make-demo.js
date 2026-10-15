'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { tidySrt } = require('../tidy.js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sample/example.srt'), 'utf8');
const result = tidySrt(source, { maxChars: 14, mergeThresholdMs: 800 });

assert.ok(result.cues.length > 0, 'demo must contain captions');
for (const cue of result.cues) {
  assert.ok(cue.text.split('\n').length <= 2, 'demo output must stay within two lines');
}

fs.mkdirSync(path.join(root, 'demo'), { recursive: true });
fs.writeFileSync(path.join(root, 'demo/example.tidy.srt'), result.srt);
console.log(`generated demo/example.tidy.srt (${result.report.outputCueCount} cues)`);
