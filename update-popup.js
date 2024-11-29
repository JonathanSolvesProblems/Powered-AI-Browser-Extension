const fs = require('fs');
const path = require('path');

const popupHtmlPath = path.join(__dirname, 'popup.html');
const cssDir = path.join(__dirname, 'build/static/css');
const jsDir = path.join(__dirname, 'build/static/js');

let popupHtml = fs.readFileSync(popupHtmlPath, 'utf-8');

const cssFiles = fs.readdirSync(cssDir).filter((file) => file.endsWith('.css'));
const latestCss = cssFiles.sort((a, b) => b.localeCompare(a))[0];

const jsFiles = fs.readdirSync(jsDir).filter((file) => file.endsWith('.js'));
const latestJs = jsFiles.sort((a, b) => b.localeCompare(a))[0];

if (!latestCss || !latestJs) {
  console.error('CSS or JS files not found in build directory.');
  process.exit(1);
}

popupHtml = popupHtml
  .replace(/main\.[a-f0-9]{8}\.css/, latestCss)
  .replace(/main\.[a-f0-9]{8}\.js/, latestJs);

fs.writeFileSync('popup.html', popupHtml, 'utf-8');

console.log('Popup HTML updated with the latest CSS and JS files:');
console.log(`CSS: ${latestCss}`);
console.log(`JS: ${latestJs}`);
