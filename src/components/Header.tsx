import React, { useState, useEffect } from 'react';
import Summarizer from './Summarizer';
import Prompter from './Prompter';
import Translator from './Translator';

interface HeaderProps {
  inputText: string;
  setInputText: (inputText: string) => void;
  output: string;
  setOutput: (outputText: string) => void;
}

const Header = ({
  inputText,
  setInputText,
  output,
  setOutput,
}: HeaderProps) => {
  const [activeComponent, setActiveComponent] = useState<string>('Ask');

  useEffect(() => {
    chrome.storage.local.get('activeTab', (data) => {
      if (data.activeTab) setActiveComponent(data.activeTab);
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ activeTab: activeComponent });
  }, [activeComponent]);

  const renderComponent = () => {
    switch (activeComponent) {
      case 'Ask':
        return <Prompter inputText={inputText} setOutput={setOutput} />;
      case 'Summarize':
        return (
          <Summarizer
            inputText={inputText}
            setInputText={setInputText}
            output={output}
            setOutput={setOutput}
          />
        );
      case 'Translate':
        return (
          <Translator
            inputText={inputText}
            setInputText={setInputText}
            setOutput={setOutput}
          />
        );

      default:
        return null;
    }
  };
  return (
    <div className="bg-gradient-to-r from-[#ffefd5] to-[#f0ba4c] shadow-lg rounded-lg p-6">
      <div className="flex justify-center space-x-4 mb-6">
        {['Ask a Question', 'Summarize', 'Translate'].map((tab, index) => {
          const componentKey = tab.split(' ')[0];
          return (
            <button
              key={index}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all 
                ${
                  activeComponent === componentKey
                    ? 'bg-[#28b5d0] text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              onClick={() => setActiveComponent(componentKey)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-[#28b5d0]">
        {renderComponent()}
      </div>
    </div>
  );
};

export default Header;
