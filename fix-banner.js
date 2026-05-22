const fs = require('fs');

function simpleBannerFn(c) {
  return c.replace(
    /function showBannedBanner\(\)\s*\{[\s\S]*?main\.insertBefore\(banner,\s*main\.firstChild\);\s*\}/,
    [
      'function showBannedBanner() {',
      "  var el = document.getElementById('bannedBanner');",
      "  if (el) el.classList.remove('hidden');",
      '}'
    ].join('\n')
  );
}

let w = fs.readFileSync('Frontend/js/worker-dashboard.js', 'utf8');
const wNew = simpleBannerFn(w);
if (w !== wNew) { console.log('worker: banner function replaced'); }
else { console.log('worker: pattern not found — may already be simple or different'); }
fs.writeFileSync('Frontend/js/worker-dashboard.js', wNew, 'utf8');

let e = fs.readFileSync('Frontend/js/employer.js', 'utf8');
const eNew = simpleBannerFn(e);
if (e !== eNew) { console.log('employer: banner function replaced'); }
else { console.log('employer: pattern not found'); }
fs.writeFileSync('Frontend/js/employer.js', eNew, 'utf8');

console.log('Done');
