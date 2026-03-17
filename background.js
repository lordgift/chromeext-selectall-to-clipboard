// 
// This is service worker running in background, Debug this on service worker. 
// 
// 

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

  console.log(`observing message : ${request.action}`);

  switch (request.action) {
    case 'openOrFindTab':
      openOrFindTab(request.title, request.url);
      break;

    case 'hookAPI':
      fetch(request.url, { method: request.method || 'GET' })
        .then(res => {

          console.log(res);

          if (!res.ok) throw new Error('Network response was not ok');
          console.log('API executed successfully');
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('Error executing API:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keeps the message channel open for sendResponse

    default:
      console.warn("Invalid message triggering.")
      break;
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
