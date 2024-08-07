(function() {
  let audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let gainNode = audioContext.createGain();


  function getDomainFromUrl(url) {
    let a = document.createElement('a');
    a.href = url;
    return a.hostname;
  }

  let currentDomain = getDomainFromUrl(window.location.href);

  function updateBadge(volume) {
    chrome.runtime.sendMessage({ type: 'updateBadge', volume: volume });
  }

  function setVolume(volume) {
    gainNode.gain.value = volume;
    let setting = {};
    setting[currentDomain] = volume;
    chrome.storage.sync.set(setting);
    updateBadge(volume);
  }

  function handleAudioElement(element) {
    if (!element.__audioContextNodeConnected) {
      console.log('Connecting audio context to element:', element);
      let source = audioContext.createMediaElementSource(element);
      source.connect(gainNode).connect(audioContext.destination);
      element.__audioContextNodeConnected = true;
    }
  }

  function handleCustomPlayers() {
    let customPlayers = document.querySelectorAll('.custom-video-player');
    customPlayers.forEach(player => {
      let videoElement = player.querySelector('video');
      if (videoElement) {
        handleAudioElement(videoElement);
      }
    });
  }

  function handleAudioElements() {
    let audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach(handleAudioElement);
    handleCustomPlayers();
  }

  function applyVolumeFromStorage() {
    chrome.storage.sync.get([currentDomain], function(result) {
      let volume = result[currentDomain] !== undefined ? result[currentDomain] : 1.0;
      gainNode.gain.value = volume;
      updateBadge(volume);
    });
  }

  chrome.storage.sync.get('excludedDomain', function(result) {
    if (result.excludedDomain === currentDomain) {
      setVolume(1.0);
      return;
    }

    applyVolumeFromStorage();
    handleAudioElements();

    new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
            handleAudioElement(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video, audio').forEach(handleAudioElement);
            node.querySelectorAll('.custom-video-player video').forEach(handleAudioElement);
          }
        });
      });
    }).observe(document.body, {
      childList: true,
      subtree: true
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'setVolume') {
      setVolume(message.volume);
      sendResponse({ status: 'volume set' });
    } else if (message.type === 'getVolume') {
      sendResponse({ volume: gainNode.gain.value });
    } else if (message.type === 'getStatus') {
      sendResponse({ status: 'running' });
    } else if (message.type === 'unexcludeDomain' && message.domain === currentDomain) {
      applyVolumeFromStorage();
      sendResponse({ status: 'domain unexcluded' });
    }
  });

  function handleShadowDom(node) {
    if (node.shadowRoot) {
      handleAudioElements(node.shadowRoot);
      node.shadowRoot.querySelectorAll('*').forEach(handleShadowDom);
    }
  }
  
  function handleAudioElements(root = document) {
    let audioElements = root.querySelectorAll('audio, video');
    audioElements.forEach(handleAudioElement);
    handleCustomPlayers(root);
  }
  
  function handleCustomPlayers(root = document) {
    let customPlayers = root.querySelectorAll('.custom-video-player');
    customPlayers.forEach(player => {
      let videoElement = player.querySelector('video');
      if (videoElement) {
        handleAudioElement(videoElement);
      }
    });
  }
  
  function traverseDom() {
    document.querySelectorAll('*').forEach(handleShadowDom);
  }
  
  traverseDom();
  
  new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
          handleAudioElement(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('video, audio').forEach(handleAudioElement);
          node.querySelectorAll('.custom-video-player video').forEach(handleAudioElement);
        }
        handleShadowDom(node);
      });
    });
  }).observe(document.body, {
    childList: true,
    subtree: true
  });

  
  
  


})();
