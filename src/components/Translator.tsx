import React, { useState, useEffect } from 'react';
import { getTranslationText } from '../utility/apiCalls';
import { getActiveTabId } from '../utility/helper';

const Translator = () => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [inputText, setInputText] = useState('');

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

  useEffect(() => {
    chrome.storage.local.get('output', (data) => {
      if (data.output) setOutput(data.output);
    });
    chrome.storage.local.get('inputText', (data) => {
      if (data.inputText) setInputText(data.inputText);
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ output: output });
  }, [output]);

  useEffect(() => {
    chrome.storage.local.set({ inputText: inputText });
  }, [inputText]);

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
          className="bg-white hover:bg-gray-100 text-gray-700 rounded-full shadow transition-all inline-flex items-center justify-center h-8 w-8 p-0"
          aria-label="Swap Languages"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
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
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Start writing here..."
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

export default Translator;
