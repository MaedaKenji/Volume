document.addEventListener('DOMContentLoaded', function() {
  let slider = document.getElementById('volumeSlider');
  let volumeValue = document.getElementById('volumeValue');
  let statusText = document.getElementById('statusText');
  let excludeDomainButton = document.getElementById('excludeDomainButton');
  let activeTabUrl;
  let currentDomain;

  function getDomainFromUrl(url) {
    let a = document.createElement('a');
    a.href = url;
    return a.hostname;
  }

  function updateExcludeButtonText(isExcluded) {
    if (isExcluded) {
      excludeDomainButton.textContent = 'Unexclude This Domain';
    } else {
      excludeDomainButton.textContent = 'Exclude This Domain';
    }
  }

  // Add an event listener to the excludeDomainButton
  excludeDomainButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const url = new URL(currentTab.url);
      currentDomain = url.hostname;

      chrome.storage.sync.get('excludedDomain', function(result) {
        let isExcluded = result.excludedDomain === currentDomain;

        if (isExcluded) {
          // Unexclude the domain
          chrome.storage.sync.remove('excludedDomain', function() {
            statusText.textContent = 'Unexcluded domain: ' + currentDomain;
            console.log('Unexcluded domain: ' + currentDomain);
            slider.disabled = false; // Enable the slider
            updateExcludeButtonText(false);

            // Send message to content script to apply stored volume
            chrome.tabs.sendMessage(currentTab.id, { type: 'unexcludeDomain', domain: currentDomain }, function(response) {
              console.log(response.status);
            });
          });
        } else {
          // Exclude the domain
          chrome.storage.sync.set({excludedDomain: currentDomain}, function() {
            statusText.textContent = 'Excluded domain: ' + currentDomain;
            console.log('Excluded domain: ' + currentDomain);
            slider.value = 100; // Set slider to 100%
            volumeValue.textContent = 100;
            slider.disabled = true; // Disable the slider
            updateExcludeButtonText(true);
          });
        }
      });
    });
  });

  // Get active tab and URL
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    let activeTab = tabs[0];
    activeTabUrl = activeTab.url;
    currentDomain = getDomainFromUrl(activeTabUrl);
    document.getElementById('url').textContent = activeTabUrl;

    // Check if the current domain is excluded
    chrome.storage.sync.get('excludedDomain', function(result) {
      let isExcluded = result.excludedDomain === currentDomain;
      updateExcludeButtonText(isExcluded);

      if (isExcluded) {
        slider.value = 100;
        volumeValue.textContent = 100;
        slider.disabled = true; // Disable the slider
        statusText.textContent = 'Domain is excluded and volume is set to 100%';
      } else {
        // Retrieve the saved volume for the current domain from storage and apply it
        chrome.storage.sync.get([currentDomain], function(result) {
          if (result[currentDomain] !== undefined) {
            slider.value = result[currentDomain] * 100;
            volumeValue.textContent = slider.value;
          } else {
            slider.value = 100; // Default value if no saved volume
            volumeValue.textContent = 100;
          }
        });

        // Get status from content script
        chrome.tabs.sendMessage(activeTab.id, { type: 'getStatus' }, function(response) {
          if (response && response.status === 'running') {
            statusText.textContent = 'Extension is running';
          } else {
            statusText.textContent = 'Extension is not running';
          }
        });
      }
    });
  });

  slider.addEventListener('input', function() {
    let volume = slider.value / 100;
    volumeValue.textContent = slider.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'setVolume', volume: volume }, function(response) {
        console.log(response.status);
      });

      let currentDomain = getDomainFromUrl(activeTabUrl);
      // Save the volume setting for the current domain to Chrome's storage
      let setting = {};
      setting[currentDomain] = volume;
      chrome.storage.sync.set(setting);
    });
  });
});
