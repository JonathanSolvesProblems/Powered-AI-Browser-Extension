const getSummary = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "getSummary", text },
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


const generateText = async (text: string) => {
    const apiUrl = 'https://api-endpoint/generate';
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text }),
    });
    
    const data = await response.json();
    return data.generatedText || 'No text generated.'
};

const rewriteText = async (text: string) => {
    const apiUrl = "https://your-api-endpoint.com/rewrite"; 
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    const data = await response.json();
    return data.rewrittenText || "No rewritten text available.";
};

const translateText = async (text: string, targetLang: string) => {
    const apiUrl = `https://your-api-endpoint.com/translate`; 
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text, targetLanguage: targetLang }),
    });
    const data = await response.json();
    return data.translatedText || "Translation failed.";
  };

export { getSummary, generateText, rewriteText, translateText }