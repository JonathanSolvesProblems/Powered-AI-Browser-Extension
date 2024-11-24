const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.REACT_APP_EXTENSION_ORIGIN_KEY;
if (!token) {
  throw new Error('origin token is not defined in .env');
}

const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = fs
  .readFileSync(manifestPath, 'utf-8')
  .replace('REACT_APP_EXTENSION_ORIGIN_KEY', token);

fs.writeFileSync(
  path.join(__dirname, 'build', 'manifest.json'),
  manifest,
  'utf-8'
);
console.log('Manifest updated with API token.');
