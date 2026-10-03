const fs = require('fs');

const xml = fs.readFileSync('wp2_extracted/word/document.xml', 'utf8');
const matches = xml.match(/<w:t\b[^>]*>(.*?)<\/w:t>/g) || [];
const fullText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
console.log('Total characters:', fullText.length);
fs.writeFileSync('wp2_fulltext.txt', fullText);

// Print sections
let idx = fullText.indexOf('Tiga Invariant');
if (idx !== -1) {
  console.log(fullText.slice(idx, idx + 2000));
}
