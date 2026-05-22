const fs = require('fs');
let c = fs.readFileSync('Frontend/js/worker-dashboard.js', 'utf8');

// Find index and replace the setTimeout call with direct call + API fallback
const idx = c.indexOf('storedUser.status === "banned"');
console.log('found at:', idx);
if (idx > -1) {
  console.log('context:', c.substring(idx - 5, idx + 120));
}
