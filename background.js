// To ensure data is persistent
let cachedInputText = '';
let cachedSummary = '';

const browserSupportsAPI = (apiName) => {
  if ('ai' in self && apiName in self.ai) {
    return true;
  } else {
    alert(`${apiName} not supported on browser. Unable to run ${apiName} API`);
    return false;
  }
};

// https://developer.chrome.com/docs/ai/summarizer-api?_gl=1*l04xrn*_up*MQ..*_ga*MTgyNzc5NTg2MS4xNzMyMzgxMDY5*_ga_H1Y3PXZW9Q*MTczMjM4MTA2OC4xLjAuMTczMjM4MTA2OC4wLjAuMA..#use-summarizer
const getSummary = async (text) => {
  const noSummary = 'No summary available';
  if (!browserSupportsAPI('summarizer')) return noSummary;
  // 'This is a scientific article'
  const options = {
    sharedContext: 'Complement the user',
    type: 'key-points',
    format: 'markdown',
    length: 'medium',
  };

  const available = (await self.ai.summarizer.capabilities()).available;
  let summarizer;
  let summary;

  if (available === 'no') {
    console.log(`The Summarizer API isn't usable.`);
    return noSummary;
  }

  if (available === 'readily') {
    summarizer = await self.ai.summarizer.create(options);

    summary = await summarizer.summarize(text, {
      context: options.sharedContext,
    });

    cachedSummary = summary;
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storeInput') {
    cachedInputText = request.text;
    sendResponse({ success: true });
  } else if (request.action == 'getCachedData') {
    sendResponse({ inputText: cachedInputText, summary: cachedSummary });
  } else if (request.action === 'getSummary') {
    getSummary(request.text).then((summary) => {
      sendResponse({ summary });
    });
    return true;
  }
});
