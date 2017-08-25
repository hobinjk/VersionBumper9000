const fs = require('fs');

if (process.argv.length !== 4) {
  console.error('Usage: node bump.js path-to-file.js version');
  process.exit(-1);
}
// Look for //* VERSION
const versionRegex = /^\/\/\*\s*VERSION/;
const fileName = process.argv[2];
const newVersion = process.argv[3];

const fileContents = fs.readFileSync(fileName, {encoding: 'utf8'});
const lines = fileContents.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(versionRegex)) {
    lines[i] = `//* VERSION ${newVersion} **//`;
    break;
  }
}

fs.writeFileSync(fileName, lines.join('\n'));

