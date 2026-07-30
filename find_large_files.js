const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
        getFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      const size = fs.statSync(filePath).size;
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
      fileList.push({ path: filePath, size, lines });
    }
  });
  return fileList;
}

const allFiles = getFiles('d:\\Tcg\\apps\\frontend\\src');
allFiles.sort((a, b) => b.lines - a.lines);
console.log('Top 15 largest files by line count:');
allFiles.slice(0, 15).forEach(f => console.log(`${f.lines} lines (${(f.size/1024).toFixed(1)} KB): ${f.path}`));
