chrome.action.onClicked.addListener(async (tab) => {

  chrome.tabs.sendMessage(tab.id, { data: 'copying' });

  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: '...'
  });

  setTimeout(() => {
    chrome.action.setBadgeText({
      tabId: tab.id,
      text: ''
    });
  }, 1500);

});
