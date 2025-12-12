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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openOrFindTab') {
    openOrFindTab(request.title, request.url);
  }
});

async function openOrFindTab(title, url) {
  const tabs = await chrome.tabs.query({ title: title });

  if (tabs.length > 0) {
    const tab = tabs[0];
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
    console.log(`Found tab with title "${title}":`, tab);
  } else {
    chrome.tabs.create({ url: url });
    console.log('Opened new tab with url:', url);
  }
}
