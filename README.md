# Powered-AI-Browser-Extension
npx create-react-app powered-ai-browser-extension
npm install --save crx-hotreload webextension-toolbox - for hot reloading and managing chrome extensions with react

in package.json, ensure:
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "extension": "npm run build && crx-hotreload"
}

npm run build