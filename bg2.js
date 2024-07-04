function updateBadgeForTab(tabId) {
    // Send a message to the content script of the tab to get the volume information.
    chrome.tabs.sendMessage(tabId, { type: 'getVolume' }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to tab:', chrome.runtime.lastError);
        // Handle the error (e.g., clear the badge text)
        chrome.action.setBadgeText({ text: '', tabId: tabId });
        return;
      }
  
      if (response && response.volume !== undefined) {
        // If the response contains volume information, update the badge text and color.
        let volumePercentage = Math.round(response.volume * 100).toString();
        chrome.action.setBadgeText({ text: volumePercentage, tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#0000FF' });
      } else {
        // If the response does not contain volume information, clear the badge text.
        chrome.action.setBadgeText({ text: '', tabId: tabId });
      }
    });
  }
  
  // Listen for messages from the content script.
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'updateBadge') {
      // If the message type is 'updateBadge', update the badge text and color.
      let volumePercentage = Math.round(message.volume * 100).toString();
      chrome.action.setBadgeText({ text: volumePercentage, tabId: sender.tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#0000FF' });
    }
  });
  
  // Listen for tab activation events.
  chrome.tabs.onActivated.addListener(function(activeInfo) {
    // When a tab is activated, update the badge for that tab.
    updateBadgeForTab(activeInfo.tabId);
  });
  
  // Listen for tab update events.
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      // When a tab is updated and the status is 'complete', update the badge for that tab.
      updateBadgeForTab(tabId);
    }
  });
  