import React, { useState, useEffect } from 'react';
import { getSummary } from '../utility/apiCalls';
import { getActiveTabId } from '../utility/helper';

const Summarizer = () => {
  const [type, setType] = useState('key-points');
  const [format, setFormat] = useState('markdown');
  const [length, setLength] = useState('medium');
  const [sharedContext, setSharedContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [inputText, setInputText] = useState('');

  const setSummaryParms = (
    type: string,
    format: string,
    length: string,
    sharedContext: string
  ) => {
    setType(type);
    setFormat(format);
    setLength(length);
    setSharedContext(sharedContext);
  };

  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: 'getCachedSummaryParms' },
      (response) => {
        if (response?.type && response?.format && response?.length) {
          setType(response.type);
          setFormat(response.format);
          setLength(response.length);
          setSharedContext(response.sharedContext);
        }
      }
    );
  }, []);

  const saveSummaryParmsToBackground = (
    type: string,
    format: string,
    length: string,
    sharedContext: string
  ) => {
    setSummaryParms(type, format, length, sharedContext);
    chrome.runtime.sendMessage(
      { action: 'storeSummaryParms', type, format, length, sharedContext },
      (response) => {
        if (!response?.success) {
          console.error('Failed to store summary parms in background script');
        }
      }
    );
  };

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

  const handleSummarize = async () => {
    const selectedText = await getSelection();
    setIsGenerating(true);
    if (inputText || selectedText) {
      setOutput('Generating summary...');
      let textToSummarize;

      if (selectedText) {
        textToSummarize = selectedText;
      } else {
        textToSummarize = inputText;
      }

      const summary = await getSummary(
        textToSummarize,
        type,
        format,
        length,
        sharedContext,
        true
      );

      setOutput(summary);
    } else {
      setOutput('Please input text or URL');
    }
    setIsGenerating(false);
  };

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

  const summarizePage = async () => {
    try {
      const tabId = await getActiveTabId();
      if (tabId === undefined) {
        console.error('No active tab found');
        return;
      }

      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.body.innerText,
      });
      setInputText(result.result || 'Failed to retrieve page content');
    } catch (error) {
      console.error('Error summarizing page:', error);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-[#fff4dc] to-[#f9e0ac] rounded-lg shadow-lg">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type:
        </label>
        <select
          value={type}
          onChange={(e) =>
            saveSummaryParmsToBackground(
              e.target.value,
              format,
              length,
              sharedContext
            )
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="key-points">Key Points</option>
          <option value="tl;dr">TL;DR</option>
          <option value="teaser">Teaser</option>
          <option value="headline">Headline</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Format:
        </label>
        <select
          value={format}
          onChange={(e) =>
            saveSummaryParmsToBackground(
              type,
              e.target.value,
              length,
              sharedContext
            )
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          <option value="markdown">Markdown</option>
          <option value="plain-text">Plain Text</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Length:
        </label>
        <select
          value={length}
          onChange={(e) =>
            saveSummaryParmsToBackground(
              type,
              format,
              e.target.value,
              sharedContext
            )
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shared Context:
        </label>
        <input
          type="text"
          value={sharedContext}
          onChange={(e) =>
            saveSummaryParmsToBackground(type, format, length, e.target.value)
          }
          placeholder="Optional shared context"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSummarize}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            isGenerating
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Summarize
        </button>
        <button
          onClick={summarizePage}
          className="px-6 py-2 rounded-lg font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-all"
        >
          Get Entire Page Text
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

export default Summarizer;
