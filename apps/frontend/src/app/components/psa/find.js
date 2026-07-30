const fs = require('fs');
const lines = fs.readFileSync('d:\\Tcg\\apps\\frontend\\src\\app\\components\\psa\\PSAGradingLab.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes("stage === 'surface'")) {
    console.log("Surface:", i + 1);
  }
  if (l.includes("stage === 'corners'")) {
    console.log("Corners:", i + 1);
  }
});
