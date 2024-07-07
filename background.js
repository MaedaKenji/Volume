function updateBadgeForTab(tabId) {
  chrome.tabs.sendMessage(tabId, { type: 'getVolume' }, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Error sending message to tab:', chrome.runtime.lastError);
      chrome.action.setBadgeText({ text: '', tabId: tabId });
      return;
    }

    if (response && response.volume !== undefined) {
      let volumePercentage = Math.round(response.volume * 100).toString();
      chrome.action.setBadgeText({ text: volumePercentage, tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#0000FF' });
    } else {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  });
}

// This is the background script for the extension. It listens for messages from the content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'updateBadge') {
    let volumePercentage = Math.round(message.volume * 100).toString();
    chrome.action.setBadgeText({ text: volumePercentage, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#0000FF' });
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  updateBadgeForTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    updateBadgeForTab(tabId);
  }
});
