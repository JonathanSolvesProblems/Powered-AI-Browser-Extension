import React, { useState, useEffect } from 'react';
import { getSummary } from '../utility/apiCalls';
import { getActiveTabId } from '../utility/helper';
interface SummarizerProps {
  inputText: string;
  setInputText: (inputText: string) => void;
  output: string;
  setOutput: (summary: string) => void;
}

// TODO: Provide user feedback when doing API call
// Extend other features: https://developer.chrome.com/docs/ai/summarizer-api?_gl=1*l04xrn*_up*MQ..*_ga*MTgyNzc5NTg2MS4xNzMyMzgxMDY5*_ga_H1Y3PXZW9Q*MTczMjM4MTA2OC4xLjAuMTczMjM4MTA2OC4wLjAuMA..#use-summarizer
// Give UI options to users to select other options
// Potentially tokens go in manifest?
// TODO: Test in a zoom meeting or something
// TODO: Add session management
// Can maybe reference other resources related?
// summarizing videos?
// TODO Unify buttons
const Summarizer = ({
  inputText,
  setInputText,
  output,
  setOutput,
}: SummarizerProps) => {
  const [type, setType] = useState('key-points');
  const [format, setFormat] = useState('markdown');
  const [length, setLength] = useState('medium');
  const [sharedContext, setSharedContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    </div>
  );
};

export default Summarizer;
