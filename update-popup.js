const fs = require('fs');
const path = require('path');

const popupHtmlPath = path.join(__dirname, 'popup.html');
const buildDir = path.join(__dirname, 'build/static');

const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

let popupHtml = fs.readFileSync(popupHtmlPath, 'utf-8');

const cssFiles = fs.readdirSync(path.join(buildDir, 'css'));
const jsFiles = fs.readdirSync(path.join(buildDir, 'js'));

const latestCss = cssFiles.sort().pop();
const latestJs = jsFiles.sort().pop();

popupHtml = popupHtml
  .replace(/main\.[a-f0-9]{8}\.css/, latestCss)
  .replace(/main\.[a-f0-9]{8}\.js/, latestJs);

fs.writeFileSync(path.join(distPath, 'popup.html'), popupHtml, 'utf-8');

console.log('Popup HTML updated with latest CSS and JS file.');
