import React, { useState, useEffect } from 'react';
import { getTranslationText } from '../utility/apiCalls';

interface TranslatorProps {
  inputText: string;
  setInputText: (inputText: string) => void;
  setOutput: (summary: string) => void;
}
// When documenting, challenge of translator APIs not being supported in service worker.
// TODO: Provide user feedback when doing API call
// Extend other features: https://developer.chrome.com/docs/ai/summarizer-api?_gl=1*l04xrn*_up*MQ..*_ga*MTgyNzc5NTg2MS4xNzMyMzgxMDY5*_ga_H1Y3PXZW9Q*MTczMjM4MTA2OC4xLjAuMTczMjM4MTA2OC4wLjAuMA..#use-summarizer
// Give UI options to users to select other options
// Potentially tokens go in manifest?
const Translator = ({
  inputText,
  setInputText,
  setOutput,
}: TranslatorProps) => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Mandarin Chinese', value: 'zh' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Russian', value: 'ru' },
    { label: 'Spanish', value: 'es' },
    { label: 'Turkish', value: 'tr' },
    { label: 'Hindi', value: 'hi' },
    { label: 'Vietnamese', value: 'vi' },
    { label: 'Bengali', value: 'bn' },
  ];

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TRANSLATED_TEXT') {
      setOutput(message.text);
    }
  });

  const handleTranslation = async () => {
    if (inputText) {
      setOutput('Getting translation...');
      // Triggers listener TRANSLATED_TEXT above
      await getTranslationText(inputText, sourceLang, targetLang);
    } else {
      setOutput('Please input text or URL');
    }
  };

  return (
    <div>
      <div>
        <label htmlFor="sourceLang">Source Language:</label>
        <select
          id="sourceLang"
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="targetLang">Target Language:</label>
        <select
          id="targetLang"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleTranslation}>Translate</button>
    </div>
  );
};

export default Translator;