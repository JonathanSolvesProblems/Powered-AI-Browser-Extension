import React, { useState, useEffect } from 'react';
import { Session } from '../utility/schemas';

interface PrompterProps {
  inputText: string;
  setOutput: (summary: string) => void;
  currentSession: Session | null;
  setCurrentSession: (currentSession: Session | null) => void;
}
// TODO: Make sure to disable API calls when loading
// TODO: Session not persistent
// TODO: Writer API for name of tab? Or substring Maybe a checkbox to change names, option for user to rename too.
// TODO: Cancel not working
// TODO: I think it's not properly creating session
// TODO: UI improvement to show selected session.
// TODO: Make responses and sessions general
/*

*/
const Prompter = ({
  inputText,
  setOutput,
  currentSession,
  setCurrentSession,
}: PrompterProps) => {
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
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
            responses: currentSession.responses,
          };
          setSessions((prev) => [...prev, clonedSession]);
          setCurrentSession(clonedSession);
        }
      }
    );
  };

  const handleTabClick = (sessionId: string) => {
    setCurrentTabId(sessionId);

    const matchingSession = sessions.find(
      (session) => session.id === sessionId
    );
    if (matchingSession) {
      setCurrentSession(matchingSession);
    }
  };

  // TODO: May need to find a way to cancel it faster, or only reveal it when it appears.
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

    let sessionId = currentSession?.id;
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
          sessionId = response.sessionId;
          let sessionExists = sessions.some(
            (session) => session.id === sessionId
          );

          if (!sessionExists) {
            const newSession = {
              id: sessionId!,
              name:
                response.promptResponse.length > 10
                  ? `${response.promptResponse.slice(0, 10)}...`
                  : response.promptResponse,
              responses: [response.promptResponse],
            };

            setSessions((prev: Session[]) => [...prev, newSession]);
            setCurrentSession(newSession);
          } else {
            setSessions((prev: Session[]) =>
              prev.map((session) =>
                session.id === sessionId
                  ? {
                      ...session,
                      responses: [
                        ...session.responses,
                        response.promptResponse,
                      ],
                    }
                  : session
              )
            );
          }

          if (sessionId) handleTabClick(sessionId);

          // const sessionResponses = responses[sessionId || ''] || [];
          // setResponses({
          //   ...responses,
          //   [sessionId || '']: [...sessionResponses, response.promptResponse],
          // });

          setOutput(response.promptResponse);
        } else {
          setOutput(response.promptResponse || 'Failed to generate response.');
        }
      }
    );
  };

  return (
    <div className="p-6 bg-gradient-to-b from-[#fff4dc] to-[#f9e0ac] rounded-lg shadow-lg">
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Top-K (1 to 8):
          </label>
          <input
            type="number"
            value={topK}
            min="1"
            max="8"
            onChange={(e) =>
              savePromptParmsToBackground(temperature, Number(e.target.value))
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature (0.0 to 2.0):
          </label>
          <input
            type="number"
            value={temperature}
            step="0.1"
            min="0.0"
            max="2.0"
            onChange={(e) =>
              savePromptParmsToBackground(Number(e.target.value), topK)
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handlePrompter}
          disabled={isGenerating}
          className={`px-6 py-2 rounded-lg font-medium transition-all 
            ${
              isGenerating
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          {isGenerating ? 'Generating...' : 'Ask Question'}
        </button>
        <button
          onClick={handleCloneSession}
          disabled={!currentSession}
          className={`px-6 py-2 rounded-lg font-medium transition-all 
            ${
              !currentSession
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
        >
          Clone Session
        </button>
        {isGenerating && (
          <button
            onClick={handleCancel}
            className="px-6 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600"
          >
            Cancel
          </button>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sessions</h3>
        <div className="flex flex-wrap gap-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleTabClick(session.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all 
                ${
                  session.id === currentTabId
                    ? 'bg-blue-100 border-blue-500 text-blue-600 border-2'
                    : 'bg-white border border-gray-300 hover:bg-gray-100'
                }`}
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
