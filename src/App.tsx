import React, { useState } from 'react';
import '../styles/styles.css';
import { getSummary, generateText, rewriteText, translateText } from './utility/apiCalls';

// TODO: Provide user feedback when doing API call
const App = () => {
    const [inputText, setInputText] = useState('');
    const [output, setOutput] = useState('');

    const handleSummarize = async () => {
        if (inputText) {
            const summary = await getSummary(inputText);
            setOutput(summary);
        } else {
            setOutput('Please input text or URL');
        }
    };

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
          <button onClick={handleSummarize}>Summarize</button>
          <button onClick={handleGenerateText}>Generate Text</button>
          <button onClick={handleRewriteText}>Rewrite Text</button>
          <button onClick={handleTranslateText}>Translate</button>
          <div id="output">{output}</div>
        </div>
      );
}