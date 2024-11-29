import React, { useEffect, useState } from 'react';
import './styles/styles.css';
import Summarizer from './components/Summarizer';
import Prompter from './components/Prompter';
import Translator from './components/Translator';
import Header from './components/Header';

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
    <div className="App">
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
      />
      <div id="output">{output}</div>
    </div>
  );
};

export default App;
