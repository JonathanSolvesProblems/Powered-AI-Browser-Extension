// To ensure data is persistent
let cachedInputText = '';
let cachedOutputText = '';
let cachedSummaryParms = {};
let cachedPromptParams = {};
let promptController;
let sessions = {};
let currentSession;

const browserSupportsAPI = (util, apiName, namespace) => {
  if (util in self && apiName in namespace) {
    return true;
  } else {
    console.log(
      `${apiName} not supported on browser. Unable to run ${apiName} API`
    );
    return false;
  }
};

const getSummary = async (
  text,
  type,
  format,
  length,
  sharedContext,
  outputAsStream = false
) => {
  const noSummary = 'No summary available';
  if (!browserSupportsAPI('ai', 'summarizer', self.ai)) return noSummary;

  const options = {
    sharedContext: sharedContext,
    type: type,
    format: format,
    length: length,
  };

  cachedSummaryParms.sharedContext = sharedContext;
  cachedSummaryParms.type = type;
  cachedSummaryParms.format = format;
  cachedSummaryParms.length = length;

  const available = (await self.ai.summarizer.capabilities()).available;
  let summarizer;
  let summary;

  if (available === 'no') {
    console.log(`The Summarizer API isn't usable.`);
    return noSummary;
  }

  if (available === 'readily') {
    summarizer = await self.ai.summarizer.create(options);

    if (outputAsStream) {
      summary = await summarizer.summarizeStreaming(text, {
        context: options.sharedContext,
      });
    } else {
      summary = await summarizer.summarize(text, {
        context: options.sharedContext,
      });
    }

    cachedOutputText = summary;
  } else {
    summarizer = await self.ai.summarizer.create(options);
    summarizer.addEventListener('downloadprogress', (e) => {
      console.log(e.loaded, e.total);
    });
    await summarizer.ready;
  }

  return summary || noSummary;
};

const getPromptResponse = async (text, temperature, topK, sessionId) => {
  const noPromptResponse = 'No response to given prompt is available';
  const promptContext = 'You are a helpful and friendly assistant';

  const modelParams = chrome.aiOriginTrial.languageModel.capabilities();
  const available = modelParams.available;
  const options = { temperature: temperature, topK: topK };
  cachedPromptParams.temperature = temperature;
  cachedPromptParams.topK = topK;

  let session;
  let context;

  try {
    if (available === 'no') {
      console.log(`The Prompt API isn't usable.`);
      return noPromptResponse;
    }

    if (sessionId && sessions[sessionId]) {
      session = sessions[sessionId].session;

      sessions[sessionId].context.push({ role: 'user', content: text });
      context = sessions[sessionId].context;
    } else {
      const controller = new AbortController();
      context = [
        { role: 'system', content: promptContext },
        { role: 'user', content: text },
      ];
      options.initialPrompts = context;
      options.signal = controller.signal;
      session = await createSession({
        ...options,
        monitor: available !== 'readily' ? createDownloadMonitor() : undefined,
      });

      sessionId = `session-${Date.now()}`;
      sessions[sessionId] = { session, controller, context };
    }

    const promptResponse = await session.prompt(text, {
      initialPrompts: context, // ensures always using most up to date context
    });

    sessions[sessionId].context.push({
      role: 'assistant',
      content: promptResponse,
    });

    console.log(`${session.tokensSoFar}/${session.maxTokens}
    (${session.tokensLeft} left)`);

    cachedOutputText = promptResponse;

    console.log(`sessions: ${JSON.stringify(sessions)}`);
    console.log(`currentSession: ${JSON.stringify(currentSession)}`);

    return {
      success: true,
      sessionId: sessionId,
      promptResponse: promptResponse || noPromptResponse,
    };
  } catch (error) {
    console.error(`Error getting prompt response: ${error}`);
    return {
      success: false,
      promptResponse: noPromptResponse,
    };
  }
};

const createSession = async (options) => {
  return await chrome.aiOriginTrial.languageModel.create(options);
};

const cloneSession = async (session, signal) => {
  return await session.clone({ signal });
};

const abortSession = (sessionId) => {
  console.log(sessions[sessionId]);
  if (sessions[sessionId]?.controller) {
    console.log('Cancelling');
    sessions[sessionId].controller.abort();
    console.log('Cancelled');
    console.log(`before ${sessions}`);
    delete sessions[sessionId];
    console.log(`after ${sessions}`);
    return true;
  }
  return false;
};

const createDownloadMonitor = () => {
  return (monitor) => {
    monitor.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
    });
  };
};

const promptSession = async (sessionId, prompt, sendResponse) => {
  const { session } = sesions[sessionId];
  const response = await session.prompt(prompt);
  sendResponse({ response });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storeInput') {
    cachedInputText = request.text;
    sendResponse({ success: true });
  } else if (request.action === 'storeSummaryParms') {
    cachedSummaryParms.sharedContext = request.sharedContext;
    cachedSummaryParms.type = request.type;
    cachedSummaryParms.format = request.format;
    cachedSummaryParms.length = request.length;
    sendResponse({ success: true });
  } else if (request.action === 'storePromptParms') {
    cachedSummaryParms.temperature = request.temperature;
    cachedSummaryParms.topK = request.topK;
    sendResponse({ success: true });
  } else if (request.action === 'getCachedData') {
    sendResponse({
      inputText: cachedInputText,
      outputText: cachedOutputText,
    });
  } else if (request.action === 'storeSessions') {
    const newSessions = request.payload;

    for (let i = 0; i < newSessions.length; i++) {
      const session = newSessions[i];
      const sessionId = session.id;

      if (sessionId) {
        const existingSession = sessions[sessionId] || {};

        sessions[sessionId] = {
          ...existingSession,
          name: session.name || existingSession.name,
          responses: [
            ...(existingSession.responses || []),
            ...(session.responses || []),
          ],
        };
      }
    }
    sendResponse({ status: 'success' });
  } else if (request.action === 'storeCurrentSession') {
    currentSession = request.payload;
    sendResponse({ status: 'success' });
  } else if (request.action === 'getSessions') {
    const filteredSessions = Object.entries(sessions)
      .filter(
        ([sessionId, sessionData]) =>
          sessionId &&
          sessionData.name &&
          sessionData.responses &&
          sessionData.responses.length > 0
      )
      .map(([sessionId, sessionData]) => ({
        id: sessionId,
        name: sessionData.name,
        responses: sessionData.responses,
      }));

    sendResponse({
      status: 'success',
      payload: filteredSessions,
    });
  } else if (request.action === 'getCurrentSession') {
    sendResponse({ status: 'success', payload: currentSession });
  } else if (request.action === 'getCachedSummaryParms') {
    sendResponse({
      sharedContext: cachedSummaryParms.sharedContext,
      type: cachedSummaryParms.type,
      format: cachedSummaryParms.format,
      length: cachedSummaryParms.length,
    });
  } else if (request.action === 'getCachedPromptParms') {
    sendResponse({
      temperature: cachedSummaryParms.temperature,
      topK: cachedSummaryParms.topK,
    });
  } else if (request.action === 'getSummary') {
    getSummary(request.text).then((summary) => {
      sendResponse({ summary });
    });
  } else if (request.action === 'getPromptResponse') {
    const { inputText, temperature, topK, sessionId } = request;
    getPromptResponse(inputText, temperature, topK, sessionId)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error(error);
        sendResponse({
          success: false,
          promptResponse: 'Failed to get prompt response',
        });
      });
  } else if (request.action === 'abortPromptResponse') {
    const { sessionId } = request;
    const success = abortSession(sessionId);
    sendResponse({ success });
  } else if (request.action === 'cloneSession') {
    const { sessionId } = request;

    const session = sessions[sessionId]?.session;

    if (session) {
      const controller = new AbortController();
      cloneSession(session, controller.signal).then((clonedSession) => {
        const context = sessions[sessionId]?.context;

        if (!context) {
          console.log('context was not defined in cloning');
        }

        const clonedSessionId = `session-${Date.now()}`;
        sessions[clonedSessionId] = {
          session: clonedSession,
          controller: controller,
          context: context,
        };
        sendResponse({ success: true, sessionId: clonedSessionId });
      });
    } else {
      sendResponse({ error: 'Session not found' });
    }
  } else if (request.action === 'removeSession' && request.sessionId) {
    const sessionId = request.sessionId;
    if (sessions[sessionId]) {
      sessions[sessionId].session.destroy();
      delete sessions[sessionId];
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Session not found.' });
    }
  }
  return true;
});

const uploadAudioAndTranscribe = async (audioBlob) => {
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      Authorization: '502f43834cd1491ea05001ca0a56e7be',
    },
    body: audioBlob,
  });

  const { upload_url } = await uploadResponse.json();

  const transcriptResponse = await fetch(
    'https://api.assemblyai.com/v2/transcript',
    {
      method: 'POST',
      headers: {
        Authorization: '502f43834cd1491ea05001ca0a56e7be',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio_url: upload_url }),
    }
  );

  const transcription = await transcriptResponse.json();
  return transcription.text;
};

const setupOffscreenDocument = async () => {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_PARSER'],
    justification: 'Performing text translation using API calls.',
  });
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'getTranslation') {
    await setupOffscreenDocument();
    const { text, sourceLang, targetLang } = request;
    chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      text: text,
      sourceLang: sourceLang,
      targetLang: targetLang,
    });
  } else if (request.type === 'TRANSLATED') {
    await chrome.offscreen.closeDocument();
    chrome.runtime.sendMessage({
      type: 'TRANSLATED_TEXT',
      text: request.text,
    });
  }

  return true;
});
