chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE') {
    const { text, sourceLang, targetLang } = message;
    const translatedText = await translateText(text, sourceLang, targetLang);
    chrome.runtime.sendMessage({ type: 'TRANSLATED', text: translatedText });
  }
});

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

const translateText = async (text, sourceLang, targetLang) => {
  const noTranslation = 'No translation available';
  if (!('translation' in self && 'createTranslator' in self.translation)) {
    return noTranslation;
  }
  const options = {
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
  };

  const available = await self.translation.canTranslate(options);

  if (available === 'no') {
    console.log(`The Translator API isn't usable.`);
    return noTranslation;
  }

  if (available !== 'readily') {
    self.translation.ondownloadprogress = (progressEvent) => {
      updateDownloadProgressBar(progressEvent.loaded, progressEvent.total);
    };
  }

  const translator = await self.translation.createTranslator(options);

  const translation = await translator.translate(text);

  return translation || noTranslation;
};
