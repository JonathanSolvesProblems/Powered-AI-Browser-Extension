import React, { useState, useEffect, useRef } from 'react';
import { Session } from '../utility/schemas';
import { moreIcon } from '../utility/icons';

const Prompter = () => {
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentTabId, setCurrentTabId] = useState<string | null>(null);
  const [cancelTriggered, setCancelTriggered] = useState<boolean>(false);
  const [renamingSessionName, setRenamingSessionName] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(
    null
  );
  const [output, setOutput] = useState('');
  const [collapsedResponses, setCollapsedResponses] = useState<Set<number>>(
    new Set()
  );
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [inputText, setInputText] = useState('');
  const [allowNewSession, setAllowNewSession] = useState(false);

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

  useEffect(() => {
    getSessionsFromBackground();
    getCurrentSessionInBackground();
  }, []);

  useEffect(() => {
    storeSessionsInBackground();
  }, [sessions]);

  useEffect(() => {
    storeCurrentSessionInBackground();
  }, [currentSession]);

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

  const storeSessionsInBackground = () => {
    chrome.runtime.sendMessage(
      { action: 'storeSessions', payload: sessions },
      (response) => {
        if (response?.status !== 'success') {
          console.error('Failed to update sessions in the background script.');
        }
      }
    );
  };

  useEffect(() => {
    if (allowNewSession && !currentSession) {
      handlePrompter();
      setAllowNewSession(false);
    }
  }, [allowNewSession]);

  const storeCurrentSessionInBackground = () => {
    chrome.runtime.sendMessage(
      { action: 'storeCurrentSession', payload: currentSession },
      (response) => {
        if (response?.status !== 'success') {
          console.error(
            'Failed to update current session in the background script.'
          );
        }
      }
    );
  };

  const getSessionsFromBackground = () => {
    chrome.runtime.sendMessage({ action: 'getSessions' }, (response) => {
      if (response?.status == 'success') {
        setSessions(response.payload);
      } else {
        console.log('Failed to update sessions in the background script.');
      }
    });
  };

  const getCurrentSessionInBackground = () => {
    chrome.runtime.sendMessage({ action: 'getCurrentSession' }, (response) => {
      if (response?.status == 'success') {
        if (response.payload && response.payload.id) {
          setCurrentSession(response.payload);
          handleTabClick(response.payload.id);
        }
      } else {
        console.log('Failed to get current session in the background script.');
      }
    });
  };

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

  const createNewSession = async () => {
    setCurrentSession(null);
    setAllowNewSession(true);
  };

  const handleCloneSession = async () => {
    if (!currentSession) {
      console.log('There is no current session available.');
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'cloneSession', sessionId: currentSession.id },
      (response) => {
        if (response?.success) {
          const clonedSession: Session = {
            id: response.sessionId,
            name: currentSession.name,
            responses: [...currentSession.responses],
          };
          setSessions((prev) => [...prev, clonedSession]);
          setCurrentSession(clonedSession);
        } else {
          console.log('Unable to clone session');
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

  useEffect(() => {
    if (!cancelTriggered) return;

    if (!currentSession) {
      setOutput('No active session to cancel.');
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'abortPromptResponse', sessionId: currentSession },
      (response) => {
        if (response?.success) {
          getSessionsFromBackground();
          setOutput('Session canceled successfully.');
          setIsGenerating(false);
          setCancelTriggered(false);
        } else {
          setOutput('Failed to cancel the session.');
          setCancelTriggered(false);
        }
      }
    );
  }, [cancelTriggered]);

  const toggleCollapse = (index: number) => {
    setCollapsedResponses((prev) => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(index)) {
        newCollapsed.delete(index);
      } else {
        newCollapsed.add(index);
      }
      return newCollapsed;
    });
  };

  const handleCancel = () => {
    getCurrentSessionInBackground();
    setCancelTriggered(true);
  };

  const handleRemoveSession = (sessionId: string) => {
    chrome.runtime.sendMessage(
      {
        action: 'removeSession',
        sessionId: sessionId,
      },
      (response) => {
        if (response?.success) {
          getSessionsFromBackground();
          const updatedSessions = sessions.filter(
            (session) => session.id !== sessionId
          );

          if (updatedSessions.length > 0) {
            handleTabClick(updatedSessions[0].id);
          } else {
            setCurrentSession(null);
          }
        } else {
          console.error(
            `Failed to remove session ${sessionId}:`,
            response?.error
          );
        }
      }
    );
  };

  const handleRenameSession = (sessionId: string) => {
    setEditingSessionId(sessionId);
    const getSession = sessions.find((s) => s.id === sessionId);
    if (getSession) setRenamingSessionName(getSession.name);
  };

  const handleRenameSubmit = () => {
    if (editingSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSessionId
            ? { ...s, name: renamingSessionName || s.name }
            : s
        )
      );

      setEditingSessionId(null);
      setRenamingSessionName('');
    }
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
                      name:
                        response.promptResponse.length > 10
                          ? `${response.promptResponse.slice(0, 10)}...`
                          : response.promptResponse,
                      responses: session.responses.includes(
                        response.promptResponse
                      )
                        ? session.responses
                        : [...session.responses, response.promptResponse],
                    }
                  : session
              )
            );
          }

          if (sessionId) handleTabClick(sessionId);

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
      </div>

      <div>
        {currentSession && (
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sessions</h3>
        )}
        <div className="flex flex-wrap gap-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all 
      ${
        session.id === currentTabId
          ? 'bg-blue-100 border-blue-500 text-blue-600 border-2'
          : 'bg-white border border-gray-300 hover:bg-gray-100'
      }`}
            >
              {editingSessionId === session.id ? (
                <input
                  type="text"
                  value={renamingSessionName || session.name}
                  onChange={(e) => setRenamingSessionName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none flex-grow"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => handleTabClick(session.id)}
                  className="flex-grow text-left"
                >
                  {session.name}
                </button>
              )}

              <div className="relative">
                <img
                  src={moreIcon}
                  alt="More Options"
                  className="w-4 h-4 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSessionMenuId(
                      session.id === openSessionMenuId ? null : session.id
                    );
                  }}
                />

                {openSessionMenuId === session.id && (
                  <div
                    className="absolute top-full right-0 mt-2 bg-white shadow-md border rounded z-10"
                    style={{ position: 'absolute', zIndex: 10 }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSessionMenuId(null);
                        handleRenameSession(session.id);
                      }}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                    >
                      Rename
                    </button>
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSessionMenuId(null);
                        createNewSession();
                      }}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                    >
                      New
                    </button> */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSessionMenuId(null);
                        handleCloneSession();
                      }}
                      disabled={!currentSession}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-green-600"
                    >
                      Copy
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSessionMenuId(null);
                        handleRemoveSession(session.id);
                      }}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
      {currentSession && (
        <div
          id="responses"
          className="mt-6 w-full max-w-3xl p-4 bg-white border border-gray-200 rounded-lg shadow text-gray-800 whitespace-pre-line"
        >
          {currentSession.responses.length > 0 ? (
            <ul className="list-disc pl-6 space-y-4">
              {' '}
              {currentSession.responses.map((response, index) => {
                const isCollapsed = collapsedResponses.has(index);
                const displayText =
                  isCollapsed && response.length > 10
                    ? `${response.slice(0, 10)}...`
                    : response;

                return (
                  <li key={index} className="text-gray-700">
                    <div
                      onClick={() => toggleCollapse(index)}
                      className="cursor-pointer hover:text-blue-600 transition-all"
                    >
                      {displayText}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Your responses will appear here.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Prompter;
