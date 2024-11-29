// To ensure data is persistent
let cachedInputText = '';
let cachedOutputText = '';
let cachedSummaryParms = {};
let cachedPromptParams = {};
let promptController;
let sessions = {};

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

// https://developer.chrome.com/docs/ai/translator-api
// TODO Only include languages in drop-down that are supported: https://developer.chrome.com/docs/ai/translator-api#language-support
// Can create some sort of dictionary
// that's it.  It's not available there (I've been running it in a side panel). Try running it in an offscreen document.
// https://developer.chrome.com/docs/extensions/reference/api/offscreen

// https://developer.chrome.com/docs/ai/summarizer-api?_gl=1*l04xrn*_up*MQ..*_ga*MTgyNzc5NTg2MS4xNzMyMzgxMDY5*_ga_H1Y3PXZW9Q*MTczMjM4MTA2OC4xLjAuMTczMjM4MTA2OC4wLjAuMA..#use-summarizer
// TODO: Expand more with UI, options like it generating as it's thinking, etc.
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
    // The Summarizer API can be used after the model is downloaded.
    summarizer = await self.ai.summarizer.create(options);
    summarizer.addEventListener('downloadprogress', (e) => {
      console.log(e.loaded, e.total);
    });
    await summarizer.ready;
  }

  return summary || noSummary;
};

// TODO: Expand later on for defaultTopk, maxTopK and default temperature
// TODO: Add controller signal to abort prompt generation
// TODO: Pick up where left off and can add a clear button, clone session to save it into different tabs
// destroy to destroy a session and can remove a tab
// TODO: Allow longer responses with promptStreaming to show partial responses, will look much cooler too.
const getPromptResponse = async (text, temperature, topK, sessionId) => {
  const noPromptResponse = 'No response to given prompt is available';
  const promptContext = 'You are a helpful and friendly assistant';

  const modelParams = chrome.aiOriginTrial.languageModel.capabilities();
  const available = modelParams.available;
  const options = { temperature: temperature, topK: topK };
  cachedPromptParams.temperature = temperature;
  cachedPromptParams.topK = topK;
  options.systemPrompt = promptContext;

  const controller = new AbortController();
  options.signal = controller.signal;

  let session;

  try {
    if (available === 'no') {
      console.log(`The Prompt API isn't usable.`);
      return noPromptResponse;
    }

    if (sessionId && sessions[sessionId]) {
      session = sessions[sessionId].session;
    } else {
      const controller = new AbortController();
      options.signal = controller.signal;
      session = await createSession({
        ...options,
        monitor: available !== 'readily' ? createDownloadMonitor() : undefined,
      });

      // TODO: Will probably have to adapt to provide context for existing sessions, revivew documentation.
      // Perhaps can re-use context in object.
      // Responses to be stored too
      sessionId = `session-${Date.now()}`;
      sessions[sessionId] = { session, controller };
    }

    const promptResponse = await session.prompt(text);
    console.log(`${session.tokensSoFar}/${session.maxTokens}
    (${session.tokensLeft} left)`);

    cachedOutputText = promptResponse;

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
  if (sessions[sessionId]?.controller) {
    sessions[sessionId].controller.abort();
    delete sessions[sessionId];
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
        const clonedSessionId = `session-${Date.now()}`;
        sessions[clonedSessionId] = { session: clonedSession, controller };
        sendResponse({ success: true, sessionId: clonedSessionId });
      });
    } else {
      sendResponse({ error: 'Session not found' });
    }
  }

  return true;
});

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
    // TODO can potentially refactor
  } else if (request.type === 'TRANSLATED') {
    chrome.runtime.sendMessage({
      type: 'TRANSLATED_TEXT',
      text: request.text,
    });
    await chrome.offscreen.closeDocument();
  }

  return true;
});
