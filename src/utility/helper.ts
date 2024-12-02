const getActiveTabId = async (): Promise<number | undefined> => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab?.id;
};

export { getActiveTabId }