const getSummary = (text: string, type: string, format: string, length: string, sharedContext: string, outputAsStream: boolean = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "getSummary", text, type, format, length, sharedContext, outputAsStream },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject('Error while fetching summary');
        } else if (response?.summary) {
          resolve(response.summary);
        } else {
          console.error("Failed to fetch summary.");
          resolve('No summary available');
        }
      }
    );
  });
};

const getPromptResponse = (text: string, temperature: number, topK: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "getPromptResponse", text, temperature, topK },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject('Error while fetching prompt response');
        } else if (response?.promptResponse) {
          resolve(response.promptResponse);
        } else {
          console.error("Failed to fetch prompt response.");
          resolve('No prompt response available');
        }
      }
    );
  });
};

const getTranslationText = (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "getTranslation", text, sourceLang, targetLang },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject('Error while fetching translation');
        } else if (response?.translation) {
          resolve(response.translation);
        } else {
          console.error("Failed to fetch translation.");
          resolve('No translation available');
        }
      }
    );
  });
};

export { getSummary, getPromptResponse, getTranslationText }