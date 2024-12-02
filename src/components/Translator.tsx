import React, { useState, useEffect } from 'react';
import { getTranslationText } from '../utility/apiCalls';
import { getActiveTabId } from '../utility/helper';

// TODO: Option to swap source and target
interface TranslatorProps {
  inputText: string;
  setInputText: (inputText: string) => void;
  output: string;
  setOutput: (summary: string) => void;
}

// TODO: Provide user feedback when doing API call
// Extend other features: https://developer.chrome.com/docs/ai/summarizer-api?_gl=1*l04xrn*_up*MQ..*_ga*MTgyNzc5NTg2MS4xNzMyMzgxMDY5*_ga_H1Y3PXZW9Q*MTczMjM4MTA2OC4xLjAuMTczMjM4MTA2OC4wLjAuMA..#use-summarizer

// Save phrases
const Translator = ({
  inputText,
  setInputText,
  output,
  setOutput,
}: TranslatorProps) => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const swapLanguages = async () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(output);
    setOutput(inputText);
  };

  useEffect(() => {
    chrome.storage.local.get('output', (data) => {
      if (data.output) setOutput(data.output);
    });
    chrome.storage.local.get('sourceLang', (data) => {
      if (data.sourceLang) setSourceLang(data.sourceLang);
    });
    chrome.storage.local.get('targetLang', (data) => {
      if (data.targetLang) setTargetLang(data.targetLang);
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ output: output });
  }, [output]);

  useEffect(() => {
    chrome.storage.local.set({ sourceLang: sourceLang });
  }, [sourceLang]);

  useEffect(() => {
    chrome.storage.local.set({ targetLang: targetLang });
  }, [targetLang]);

  const getSelection = async () => {
    try {
      const tabId = await getActiveTabId();
      if (tabId === undefined) {
        console.error('No active tab found');
        return;
      }

      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const selection = window.getSelection();
          return selection ? selection.toString() : '';
        },
      });
      if (result.result) {
        setInputText(result.result);
        return result.result;
      }
      return '';
    } catch (error) {
      console.error('Error summarizing selection:', error);
      return '';
    }
  };

  const handleTranslation = async () => {
    const selectedText = await getSelection();
    setIsGenerating(true);
    if (inputText || selectedText) {
      setOutput('Getting translation...');
      // Triggers listener TRANSLATED_TEXT above
      if (selectedText) {
        await getTranslationText(selectedText, sourceLang, targetLang);
      } else {
        await getTranslationText(inputText, sourceLang, targetLang);
      }
    } else {
      setOutput('Please input text or URL');
    }

    setIsGenerating(false);
  };

  return (
    <div className="p-6 bg-gradient-to-b from-[#e7f3ff] to-[#cfe9ff] rounded-lg shadow-lg">
      <div className="mb-4">
        <label
          htmlFor="sourceLang"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Source Language:
        </label>
        <select
          id="sourceLang"
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center items-center mb-6">
        <button
          onClick={swapLanguages}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full shadow transition-all"
          aria-label="Swap Languages"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
      </div>

      <div className="mb-6">
        <label
          htmlFor="targetLang"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Target Language:
        </label>
        <select
          id="targetLang"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-center">
        <button
          onClick={handleTranslation}
          disabled={isGenerating}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            isGenerating
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isGenerating ? 'Translating' : 'Translate'}
        </button>
      </div>
    </div>
  );
};

export default Translator;
