const fs = require('fs');
const path = require('path');

const directory = 'e:\\Praktik Plan WP\\dapur-nia\\dapur-nia\\src';

const replacements = {
  '#C2410C': '#4D642D', // utama
  '#9A3412': '#36491C', // utama-gelap
  '#FFEDD5': '#E8EFE0', // utama-muda
  '#FFF8F1': '#FCF9F2', // latar
  '#EADFD4': '#E0E2D8', // garis
  '#1F1A17': '#1C2311', // teks
  '#6B5E55': '#5F6B4F', // teks-2
  '#FAF5EE': '#F4F7EF', // latar-2
  '#F2EAE3': '#D7DFC9', // latar-3
  '#B5A599': '#9AA787', // teks-3
  '#8C7A6B': '#74835F', // teks-4
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walkDir(directory);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [oldColor, newColor] of Object.entries(replacements)) {
    // Replace uppercase and lowercase hex
    const regex = new RegExp(oldColor, 'gi');
    if (regex.test(content)) {
      content = content.replace(regex, newColor);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
