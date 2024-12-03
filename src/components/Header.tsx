import React, { useState, useEffect } from 'react';
import Summarizer from './Summarizer';
import Prompter from './Prompter';
import Translator from './Translator';

const Header = () => {
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
        return <Prompter />;
      case 'Summarize':
        return <Summarizer />;
      case 'Translate':
        return <Translator />;

      default:
        return null;
    }
  };
  return (
    <div className="bg-gradient-to-br from-[#fff4dc] via-[#f0ba4c] to-[#f7d488] shadow-xl rounded-xl p-8 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex justify-between space-x-4 mb-6">
          {['Ask a Question', 'Summarize', 'Translate'].map((tab, index) => {
            const componentKey = tab.split(' ')[0];
            return (
              <button
                key={index}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all text-center 
                  ${
                    activeComponent === componentKey
                      ? 'bg-[#28b5d0] text-white shadow-lg scale-105'
                      : 'bg-[#fdf5e6] text-gray-700 hover:bg-[#fde7bd] hover:shadow-sm'
                  }`}
                onClick={() => setActiveComponent(componentKey)}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="bg-[#ffffff] rounded-lg shadow-lg p-6 border-l-8 border-[#28b5d0]">
          {renderComponent()}
        </div>
      </div>
    </div>
  );
};

export default Header;
