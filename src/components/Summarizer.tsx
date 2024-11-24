import React, { useState, useEffect } from 'react';
import { getSummary } from '../utility/apiCalls';

interface SummarizerProps {
  inputText: string;
  setOutput: (summary: string) => void;
}

// TODO: Provide user feedback when doing API call
// Extend other features: https://developer.chrome.com/docs/ai/summarizer-api?_gl=1*l04xrn*_up*MQ..*_ga*MTgyNzc5NTg2MS4xNzMyMzgxMDY5*_ga_H1Y3PXZW9Q*MTczMjM4MTA2OC4xLjAuMTczMjM4MTA2OC4wLjAuMA..#use-summarizer
// Give UI options to users to select other options
// Potentially tokens go in manifest?
const Summarizer = ({ inputText, setOutput }: SummarizerProps) => {
  const handleSummarize = async () => {
    if (inputText) {
      setOutput('Generating summary...');
      const summary = await getSummary(inputText);
      setOutput(summary);
    } else {
      setOutput('Please input text or URL');
    }
  };

  return <button onClick={handleSummarize}>Summarize</button>;
};

export default Summarizer;

/*
{
  "manifest_version": 3,
  "name": "Extension for API",
  "version": "1.0",
  "description": "A simple api tester",
  "permissions": ["aiLanguageModelOriginTrial", "activeTab"],
  "trial_tokens": [
    "[STUFF]"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runCode") {
    console.log("Received from popup:", message);

    // Respond immediately (required for synchronous listeners)
    sendResponse({ response: "Hello Popup" });

    // Handle the async operation in a separate function
    (async () => {
      try {
        const session = await ai.languageModel.create({
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              console.log(Downloaded ${e.loaded} of ${e.total} bytes.);
            });
          },
        });

        console.log("Language model session created:", session);
      } catch (error) {
        console.error(error.name, error);
      }
    })();

    // Return true to indicate an asynchronous response might occur
    return true;
  }
}); Here is my background.js
*/
