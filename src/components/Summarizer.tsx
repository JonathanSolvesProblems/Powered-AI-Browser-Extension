import React, { useState, useEffect } from 'react';
import { getSummary } from '../utility/apiCalls';
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
    if (inputText) {
      setOutput('Generating summary...');
      const summary = await getSummary(
        inputText,
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
  };

  const summarizeSelection = async () => {
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
      setInputText(result.result || 'No text selected');
    } catch (error) {
      console.error('Error summarizing selection:', error);
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

  const getActiveTabId = async (): Promise<number | undefined> => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab?.id;
  };

  return (
    <>
      <div>
        <label>
          Type:
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
          >
            <option value="key-points">Key Points</option>
            <option value="tl;dr">TL;DR</option>
            <option value="teaser">Teaser</option>
            <option value="headline">Headline</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Format:
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
          >
            <option value="markdown">Markdown</option>
            <option value="plain-text">Plain Text</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Length:
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
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Shared Context:
          <input
            type="text"
            value={sharedContext}
            onChange={(e) =>
              saveSummaryParmsToBackground(type, format, length, e.target.value)
            }
            placeholder="Optional shared context"
          />
        </label>
      </div>

      <button onClick={handleSummarize}>Summarize</button>
      <button onClick={summarizeSelection}>Summarize Highlighted Text</button>
      <button onClick={summarizePage}>Summarize Entire Page</button>
    </>
  );
};

export default Summarizer;
