import React, { useState } from 'react';
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
    <div className="bg-[#fff4dc] shadow-md p-4">
      <div className="flex justify-center space-x-4 mb-6">
        <button
          className={`btn ${activeComponent === 'Ask' ? 'btn-active' : ''}`}
          onClick={() => setActiveComponent('Ask')}
        >
          Ask a Question
        </button>
        <button
          className={`btn ${
            activeComponent === 'Summarize' ? 'btn-active' : ''
          }`}
          onClick={() => setActiveComponent('Summarize')}
        >
          Summarize
        </button>
        <button
          className={`btn ${
            activeComponent === 'Translate' ? 'btn-active' : ''
          }`}
          onClick={() => setActiveComponent('Translate')}
        >
          Translate
        </button>
      </div>
      {renderComponent()}
    </div>
  );
};

export default Header;
