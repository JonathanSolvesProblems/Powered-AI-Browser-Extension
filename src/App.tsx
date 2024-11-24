import React, { useEffect, useState } from 'react';
import './styles/styles.css';
import { generateText, rewriteText, translateText } from './utility/apiCalls';
import Summarizer from './components/Summarizer';

const App = () => {
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');

  const saveInputToBackground = (text: string) => {
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
        if (response.summary) {
          setOutput(response.summary);
        }
      }
    });
  }, [setInputText, setOutput]);

  useEffect(() => {
    if (inputText) {
      saveInputToBackground(inputText);
    }
  }, [inputText]);

  const handleGenerateText = async () => {
    if (inputText) {
      const generatedText = await generateText(inputText);
      setOutput(generatedText);
    } else {
      setOutput('Please provide a prompt for text generation.');
    }
  };

  const handleRewriteText = async () => {
    if (inputText) {
      const rewrittenText = await rewriteText(inputText);
      setOutput(rewrittenText);
    } else {
      setOutput('Please provide text to rewrite.');
    }
  };

  const handleTranslateText = async () => {
    if (inputText) {
      const translatedText = await translateText(inputText, 'es'); // Example to translate to Spanish
      setOutput(translatedText);
    } else {
      setOutput('Please provide text to translate.');
    }
  };

  return (
    <div className="App">
      <h1>AI Research Assistant</h1>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter your research content or URL"
      />
      <Summarizer inputText={inputText} setOutput={setOutput} />
      <button onClick={handleGenerateText}>Generate Text</button>
      <button onClick={handleRewriteText}>Rewrite Text</button>
      <button onClick={handleTranslateText}>Translate</button>
      <div id="output">{output}</div>
    </div>
  );
};

export default App;
