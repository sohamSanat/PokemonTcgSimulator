const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.next') && !filePath.includes('dist')) {
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

const targetDir = path.join(__dirname, '../apps/frontend/src');
const allFiles = getFiles(targetDir);
allFiles.sort((a, b) => b.lines - a.lines);

console.log('Top 15 largest files by line count:');
allFiles.slice(0, 15).forEach(f => {
  const relPath = path.relative(path.join(__dirname, '..'), f.path);
  console.log(`${f.lines} lines (${(f.size/1024).toFixed(1)} KB): ${relPath}`);
});
