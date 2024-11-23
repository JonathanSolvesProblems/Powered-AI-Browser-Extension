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

Chrome Extension:
- Summarize Page - Summarization API
- Use it to cite a section of the page, can highlight what to paraphrase
	and will automatically cite it in appropriate format based on standard.
	- If nothing highlighted, then assume whole page.
- Take Info from Page with User's Prompt to Re-Write Tone: Write API
- Query Page to See if Anything Relevant to Search
- Rewrite API as well on google docs
- Translation API to view web page and translate a summary for the user.
