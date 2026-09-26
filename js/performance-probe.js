// Opt-in local diagnostics. No network requests or persistence.
if (new URLSearchParams(location.search).has('measure')) {
  const samples = [];
  let previous;
  let start;
  const output = document.createElement('output');
  output.id = 'performance-results';
  output.style.cssText = 'position:fixed;bottom:0;left:0;z-index:10000;background:#fff;color:#111;font:12px monospace;padding:8px;pointer-events:none';
  document.body.append(output);
  function sample(time) {
    start ??= time;
    if (previous && time - start > 1500) samples.push(time - previous);
    previous = time;
    if (samples.length >= 180) {
      const sorted = samples.slice().sort((a, b) => a - b);
      output.textContent = JSON.stringify({ median: +sorted[90].toFixed(2), p95: +sorted[171].toFixed(2), over25ms: samples.filter(t => t > 25).length, samples: samples.length, renders: [...document.querySelectorAll('[data-renders]')].map(el => [el.id, el.dataset.renders]) });
      samples.length = 0;
    }
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
}
