(function () {
  'use strict';

  const { tidySrt, tidyFilename, formatTimestamp } = window.CaptionTidy;
  const fileInput = document.querySelector('#file-input');
  const dropZone = document.querySelector('#drop-zone');
  const maxCharsInput = document.querySelector('#max-chars');
  const mergeInput = document.querySelector('#merge-threshold');
  const exportAllButton = document.querySelector('#export-all');
  const results = document.querySelector('#results');
  const status = document.querySelector('#status');
  let files = [];

  function settings() {
    return {
      maxChars: Number(maxCharsInput.value),
      mergeThresholdMs: Number(mergeInput.value),
    };
  }

  function reportText(report) {
    return [
      `原始 ${report.sourceCueCount} 条 → 输出 ${report.outputCueCount} 条`,
      `改动 ${report.changedCueCount} 条 · 合并 ${report.mergeCount} 条 · 断行 ${report.lineBreakCount} 处`,
      `超限 ${report.overLimitCount} 条 · 跳过异常块 ${report.skippedBlockCount} 个`,
    ].join('\n');
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'application/x-subrip;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function makeCueRow(cue) {
    const row = document.createElement('div');
    row.className = `cue-row${cue.overLimit ? ' is-over' : ''}`;

    const time = document.createElement('div');
    time.className = 'cue-time';
    time.textContent = `${formatTimestamp(cue.startMs)}\n${formatTimestamp(cue.endMs)}`;

    const before = document.createElement('pre');
    before.className = 'cue-text before';
    before.textContent = cue.beforeText;

    const after = document.createElement('pre');
    after.className = 'cue-text after';
    after.textContent = cue.text;

    row.append(time, before, after);
    return row;
  }

  function makeResultCard(entry) {
    const card = document.createElement('article');
    card.className = 'file-result';

    const head = document.createElement('div');
    head.className = 'result-head';
    const heading = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'result-title';
    title.textContent = entry.name;
    const report = document.createElement('pre');
    report.className = 'report';
    heading.append(title, report);
    head.append(heading);
    card.append(head);

    if (entry.error) {
      report.textContent = '读取失败';
      const message = document.createElement('p');
      message.className = 'empty-file';
      message.textContent = entry.error;
      card.append(message);
      return card;
    }

    report.textContent = reportText(entry.result.report);
    if (entry.result.warnings.length) {
      report.textContent += `\n${entry.result.warnings.join(' ')}`;
    }

    if (!entry.result.cues.length) {
      const message = document.createElement('p');
      message.className = 'empty-file';
      message.textContent = '没有找到可导出的字幕条目。请检查时间码和文件编码。';
      card.append(message);
      return card;
    }

    const download = document.createElement('button');
    download.className = 'download-button';
    download.type = 'button';
    download.textContent = '下载新 SRT';
    download.addEventListener('click', () => {
      downloadText(tidyFilename(entry.name), entry.result.srt);
    });
    head.append(download);

    const labels = document.createElement('div');
    labels.className = 'comparison-head';
    for (const label of ['时间', '改前', '改后']) {
      const cell = document.createElement('span');
      cell.textContent = label;
      labels.append(cell);
    }
    card.append(labels);
    entry.result.cues.forEach((cue) => card.append(makeCueRow(cue)));
    return card;
  }

  function recalculate() {
    files = files.map((entry) => {
      if (entry.error) return entry;
      return { ...entry, result: tidySrt(entry.source, settings()) };
    });

    results.replaceChildren(...files.map(makeResultCard));
    const ready = files.filter((entry) => entry.result && entry.result.cues.length);
    exportAllButton.disabled = ready.length === 0;
    status.textContent = files.length
      ? `已载入 ${files.length} 个文件，${ready.length} 个可以导出。修改设置会立即重算。`
      : '还没有文件。可以先试试 sample/example.srt。';
  }

  async function loadFiles(fileList) {
    const selected = Array.from(fileList);
    if (!selected.length) return;

    status.textContent = `正在读取 ${selected.length} 个文件…`;
    const loaded = await Promise.all(selected.map(async (file) => {
      try {
        const source = await file.text();
        return { name: file.name, source, result: tidySrt(source, settings()) };
      } catch (error) {
        return { name: file.name, error: `无法读取：${error.message}` };
      }
    }));
    files = loaded;
    recalculate();
  }

  fileInput.addEventListener('change', () => loadFiles(fileInput.files));
  maxCharsInput.addEventListener('input', recalculate);
  mergeInput.addEventListener('input', recalculate);

  for (const eventName of ['dragenter', 'dragover']) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add('is-dragging');
    });
  }

  for (const eventName of ['dragleave', 'drop']) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove('is-dragging');
    });
  }

  dropZone.addEventListener('drop', (event) => loadFiles(event.dataTransfer.files));
  exportAllButton.addEventListener('click', () => {
    const ready = files.filter((entry) => entry.result && entry.result.cues.length);
    // TODO: Some browsers ask before allowing several downloads; add a no-dependency fallback if this proves confusing.
    ready.forEach((entry, index) => {
      setTimeout(() => downloadText(tidyFilename(entry.name), entry.result.srt), index * 120);
    });
  });
})();
