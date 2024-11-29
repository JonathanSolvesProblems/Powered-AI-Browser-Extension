import React, { useEffect, useState } from 'react';
import './styles/styles.css';
import Summarizer from './components/Summarizer';
import Prompter from './components/Prompter';
import Translator from './components/Translator';
import Header from './components/Header';

// TODO: Wrap output
const App = () => {
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');

  const saveInputToBackground = (text: string) => {
    setInputText(text);
    chrome.runtime.sendMessage({ action: 'storeInput', text }, (response) => {
      if (!response?.success) {
        console.error('Failed to store input in background script');
      }
    });
  };

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getCachedData' }, (response) => {
      if (response?.inputText) {
        setInputText(response.inputText);
        if (response.outputText) {
          setOutput(response.outputText);
        }
      }
    });
  }, [setInputText, setOutput]);

  useEffect(() => {
    if (inputText) {
      saveInputToBackground(inputText);
    }
  }, [inputText]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff4dc] to-[#fef3c7] p-6 flex flex-col items-center">
      <Header
        inputText={inputText}
        setInputText={setInputText}
        output={output}
        setOutput={setOutput}
      />

      <textarea
        value={inputText}
        onChange={(e) => saveInputToBackground(e.target.value)}
        placeholder="Enter your research content or URL"
        className="mt-6 w-full max-w-3xl h-32 p-4 border border-gray-300 rounded-lg shadow focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none text-gray-700"
      />

      <div
        id="output"
        className="mt-6 w-full max-w-3xl p-4 bg-white border border-gray-200 rounded-lg shadow text-gray-800 whitespace-pre-line"
      >
        {output || 'Your output will appear here.'}
      </div>
    </div>
  );
};

export default App;
