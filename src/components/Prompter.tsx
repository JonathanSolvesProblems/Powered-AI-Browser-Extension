import React, { useState, useEffect } from 'react';

interface PrompterProps {
  inputText: string;
  setOutput: (summary: string) => void;
}

interface Session {
  id: string;
  name: string;
}
// TODO: Make sure to disable API calls when loading
// TODO: Session not persistent
// TODO: Writer API for name of tab? Or substring Maybe a checkbox to change names, option for user to rename too.
const Prompter = ({ inputText, setOutput }: PrompterProps) => {
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<{ [key: string]: string[] }>({});
  const [currentTabId, setCurrentTabId] = useState<string | null>(null);

  const setPromptParms = (temperature: number, topK: number) => {
    setTemperature(temperature);
    setTopK(topK);
  };

  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: 'getCachedPromptParms' },
      (response) => {
        if (response?.temperature && response?.topK) {
          setTemperature(response.temperature);
          setTopK(response.topK);
        }
      }
    );
  }, []);

  const savePromptParmsToBackground = (temperature: number, topK: number) => {
    setPromptParms(temperature, topK);
    chrome.runtime.sendMessage(
      { action: 'storePromptParms', temperature, topK },
      (response) => {
        if (!response?.success) {
          console.error('Failed to store prompt parms in background script');
        }
      }
    );
  };

  const handleCloneSession = async () => {
    if (!currentSession) return;

    chrome.runtime.sendMessage(
      { action: 'cloneSession', sessionId: currentSession.id },
      (response) => {
        if (response?.success) {
          const clonedSession: Session = {
            id: response.sessionId,
            name: `${currentSession.name} (Cloned)`,
          };
          setSessions((prev) => [...prev, clonedSession]);
          setCurrentSession(clonedSession);
        }
      }
    );
  };

  const handleTabClick = (sessionId: string) => {
    setCurrentTabId(sessionId);
  };

  const handleCancel = () => {
    if (!currentSession) {
      setOutput('No active session to cancel.');
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'abortPromptResponse', sessionId: currentSession },
      (response) => {
        if (response?.success) {
          setOutput('Session canceled successfully.');
          setIsGenerating(false);
        } else {
          setOutput('Failed to cancel the session.');
        }
      }
    );
  };

  const handlePrompter = async () => {
    if (!inputText) {
      setOutput('Please input text or URL');
      return;
    }

    setIsGenerating(true);
    setOutput('Generating response from prompt...');

    const sessionId = currentSession?.id;
    chrome.runtime.sendMessage(
      {
        action: 'getPromptResponse',
        inputText,
        temperature,
        topK,
        sessionId,
      },
      (response) => {
        setIsGenerating(false);
        if (response?.success) {
          let sessionExists = sessions.some(
            (session) => session.id === sessionId
          );

          if (!sessionExists) {
            const newSession = {
              id: sessionId!,
              name: `Session ${sessions.length + 1}`,
            };

            setSessions((prev: Session[]) => [...prev, newSession]);
            setCurrentSession(newSession);
          }

          const sessionResponses = responses[sessionId || ''] || [];
          setResponses({
            ...responses,
            [sessionId || '']: [...sessionResponses, response.message],
          });
          setOutput(response.promptResponse);
        } else {
          setOutput(response.promptResponse || 'Failed to generate response.');
        }
      }
    );
  };

  return (
    <div>
      <div>
        <label>
          Top-K (1 to 8):
          <input
            type="number"
            value={topK}
            min="1"
            max="8"
            onChange={(e) =>
              savePromptParmsToBackground(temperature, Number(e.target.value))
            }
          />
        </label>
      </div>
      <div>
        <label>
          Temperature (0.0 to 2.0):
          <input
            type="number"
            value={temperature}
            step="0.1"
            min="0.0"
            max="2.0"
            onChange={(e) =>
              savePromptParmsToBackground(Number(e.target.value), topK)
            }
          />
        </label>
      </div>
      <button onClick={handlePrompter} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Ask Question'}
      </button>
      <button onClick={handleCloneSession} disabled={!currentSession}>
        Clone Session
      </button>
      {isGenerating && <button onClick={handleCancel}>Cancel</button>}
      <div>
        <h3>Sessions</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleTabClick(session.id)}
              style={{
                padding: '8px',
                border:
                  session.id === currentTabId
                    ? '2px solid blue'
                    : '1px solid gray',
                background: session.id === currentTabId ? '#e0f7fa' : '#ffffff',
              }}
            >
              {session.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Prompter;
