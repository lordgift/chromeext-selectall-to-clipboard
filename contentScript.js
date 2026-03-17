// 
// This is main script but background will trigger it on start.
// Debug this on running page. 
// 
// 

chrome.runtime.onMessage.addListener(async (msg) => {
  console.log(msg);
  switch (msg.data) {
    case 'copying':

      showLoadingOverlay();

      updateLoadingOverlay("Opening masked eyes");

      await openMaskingEyesInTikTokOrderDetail();

      updateLoadingOverlay("Selecting and copying whole text");
      const selectAllResult = await selectAllAndCopy();
      if (!selectAllResult) {
        console.error("Failed to select all page");
        return;
      }

      updateLoadingOverlay("Extracting clipboard");
      const formUrl = await extractClipboardData()

      if (!formUrl) {
        return;
      }

      console.log(`🎉 ${formUrl}`);

      updateLoadingOverlay("Submitting form");
      // Send message to background script to execute the API call (safe from CORS)
      const response = await chrome.runtime.sendMessage({
        action: 'hookAPI',
        url: formUrl,
        method: 'GET'
      });
      console.log("API Execution Result:", response);

      if (response.success) {
        updateLoadingOverlay("Script finished 🎉");
      } else {
        updateLoadingOverlay("Script failed ❌❌❌, developer support needed.");
      }

      // publishMessageToOpenTab({
      //   title: '<CHROME TAB TITLE>',
      //   url: "<CHROME TAB URL>"
      // });


      break;

    default:
      console.warn("no case matches for ", msg.data);
      break;
  }
});

function showLoadingOverlay() {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.color = 'white';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontSize = '2em';
    overlay.style.zIndex = '10000';
    overlay.style.flexDirection = 'column';

    const title = document.createElement('div');
    title.innerText = 'Processing...';
    overlay.appendChild(title);

    const detailLine = document.createElement('div');
    detailLine.id = 'loading-overlay-detail';
    detailLine.style.fontSize = '18px';
    detailLine.style.marginTop = '10px';
    overlay.appendChild(detailLine);

    const actionBtn = document.createElement('button');
    actionBtn.id = 'loading-overlay-action-btn';
    actionBtn.innerText = 'OK';
    actionBtn.style.display = 'none';
    actionBtn.style.marginTop = '20px';
    actionBtn.style.padding = '10px 24px';
    actionBtn.style.fontSize = '18px';
    actionBtn.style.cursor = 'pointer';
    actionBtn.style.borderRadius = '8px';
    actionBtn.style.backgroundColor = '#f44336';
    actionBtn.style.color = 'white';
    actionBtn.style.border = '3px solid white';
    actionBtn.style.fontWeight = 'bold';
    actionBtn.style.display = 'none';
    overlay.appendChild(actionBtn);

    const closeBtn = document.createElement('div');
    closeBtn.innerText = 'X';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '20px';
    closeBtn.style.right = '20px';
    closeBtn.style.fontSize = '30px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.color = 'white';
    closeBtn.onclick = hideLoadingOverlay;
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function updateLoadingOverlay(message) {
  const overlayDetail = document.getElementById('loading-overlay-detail');
  if (overlayDetail) {
    overlayDetail.innerText = message;
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}


async function selectAllAndCopy() {
  var body = document.body;
  var selection;
  var range;

  if (window.getSelection) {
    selection = window.getSelection();
    range = document.createRange();
    range.selectNodeContents(body);
    selection.removeAllRanges();
    selection.addRange(range);


    // Try to focus the window to satisfy Clipboard API requirements
    window.focus();

    // Modern Clipboard API
    try {
      await navigator.clipboard.writeText(selection.toString());
      console.log("successfully copied");
      return true;
    } catch (err) {
      console.error("Fallback failed: ", err);
      return false;
    }

  }
}


async function openMaskingEyesInTikTokOrderDetail() {
  const maskingEyesButton = document.querySelectorAll('[data-log_click_for="open_phone_plaintext"]');
  Array.from(maskingEyesButton).slice(0, 2).forEach(el => {

    // Check if click is a function, otherwise dispatch event
    if (typeof el.click === 'function') {
      el.click();
    } else {
      console.log("el.click is not a function, dispatching event", el);
      var event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      el.dispatchEvent(event);
    }
  });

  // Wait for the UI to update with unmasked data
  await new Promise(resolve => setTimeout(resolve, 2000));
}

function publishMessageToOpenTab(tabJson) {
  chrome.runtime.sendMessage({
    action: 'openOrFindTab',
    title: tabJson.title,
    url: tabJson.url
  });
}

async function extractClipboardData() {
  try {
    const rawData = await navigator.clipboard.readText();

    // 1. Order Number: 18 digits right after "Help" or at the start
    const orderNoMatch = rawData.match(/Help\s*\n\s*(\d{18})/i) || rawData.match(/^(\d{18})/m);

    // 2. Time Created: Date and Time
    const timeCreatedMatch = rawData.match(/Time created\s*(\d{1,2}\/\d{1,2}\/\d{4}\s\d{1,2}:\d{2}:\d{2}\s[AP]M)/i);

    // 3. User Name: Text right after "User name"
    const userNameMatch = rawData.match(/User name\s*([\s\S]*?)\s*Shipping address/i);

    // 5. Shipping Address (FIXED for 1st line/Customer Name): Looks for the first non-empty line after "Shipping address"
    // Captures the text after "Shipping address" and any following newlines/spaces, until the next newline.
    const shippingAddressMatch = rawData.match(/Shipping address\s*\n\s*([^\n\r]+)/i);

    const paymentMethodMatch = rawData.match(/Payment method\s*([\s\S]*?)\s*Show details/i);

    const totalPriceMatch = rawData.match(/Total\s*฿(.*)/i);


    // --- Validate Extraction ---
    if (orderNoMatch && timeCreatedMatch && userNameMatch && shippingAddressMatch && paymentMethodMatch && totalPriceMatch) {

      // Extracted Values
      const orderNo = orderNoMatch[1].trim();
      const timeCreated = timeCreatedMatch[1].trim();
      const userName = userNameMatch[1].trim();
      const customerName = shippingAddressMatch[1].trim();
      const paymentMethod = paymentMethodMatch[1].trim();
      const totalPrice = totalPriceMatch[1].trim();

      console.log(`Order No: ${orderNo}`);

      if (await isExistStorageKey(orderNo)) {
        updateLoadingOverlay("❌ duplicate run on this orderNo");
        showDeleteAndReloadButton(orderNo);
        return null;

      } else {
        await storeOrderNo(orderNo);
      }

      let tiktokAvatarFormula;
      let tiktokNickname;

      if (await isExistStorageKey(userName)) {
        updateLoadingOverlay("✅ Stored profile found, loading from cache");
        const storedProfile = await getStoredProfile(userName);

        const imageExpiresMatch = storedProfile.avatar.match(/x-expires=(\d{10}).*/i);
        if (!imageExpiresMatch || isImageCacheExceeded(imageExpiresMatch[1].trim())) {
          await removeStorageKey(userName);
          console.log("❌ Image cache expired");

          hideLoadingOverlay();

          //recursively call this function
          await extractClipboardData();

        } else {
          tiktokAvatarFormula = storedProfile.avatar;
          tiktokNickname = storedProfile.nickname;
        }

      } else {
        updateLoadingOverlay("Looking for TikTok Profile");
        const apifyFetched = await GET_TIKTOK_NAME_VIA_APIFY(`https://tiktok.com/@${userName}`).then((apifyFetched) => {
          console.log("Apify Result:", apifyFetched);

          const safeApifyFetched = apifyFetched || {
            "nickname": "APIFY not found",
            "avatar": ""
          };

          tiktokAvatarFormula = `=IMAGE("${safeApifyFetched["avatar"]}")`;
          tiktokNickname = safeApifyFetched["nickname"];

          // no cache if apifyFetched is null
          if (apifyFetched) {
            storeProfile(userName, tiktokAvatarFormula, tiktokNickname);
          }
        });
      }

      const formUrl = `https://docs.google.com/forms/d/e/<GG_FORM_ID>/formResponse?entry.xxxx=${timeCreated}&entry.xxxxx=${orderNo}&entry.xxxx=${tiktokNickname}&entry.xxxx=${tiktokAvatarFormula}&entry.xxxx=${tiktokNickname}&entry.xxxx=${customerName}&entry.xxxx=${totalPrice}&entry.xxxxx=${paymentMethod}&submit=Submit`
      return formUrl;

    } else {
      // extracting error
      let errorMsg = "Could not find all required patterns in the pasted text.\n";
      errorMsg += `Order No Found: ${!!orderNoMatch}\n`;
      errorMsg += `Time Created Found: ${!!timeCreatedMatch}\n`;
      errorMsg += `User Name Found: ${!!userNameMatch}\n`;
      errorMsg += `Customer Name Found: ${!!shippingAddressMatch}\n`;
      errorMsg += `Total Price Found: ${!!totalPriceMatch}\n`;
      errorMsg += `Payment Method Found: ${!!paymentMethodMatch}\n`;
      console.error(errorMsg);
      return null
    }


  } catch (error) {
    console.error(error);
    return null;
  }

}

/**
 * Executes a synchronous Apify TikTok scraping job using the 
 * clockworks~tiktok-scraper, replicating the successful cURL command.
 * * NOTE: This synchronous method is prone to Apps Script timeouts (limit is ~30 seconds).
 * Use the Asynchronous method (with two functions) for reliable, large-scale use.
 *
 * @return The raw JSON response string from Apify.
 * @customfunction
 */
async function GET_TIKTOK_NAME_VIA_APIFY(targetProfile) {

  const ACTOR_ID = 'clockworks~tiktok-scraper';

  const APIFY_TOKEN = '<YOUR APIFY TOKEN>';

  // ---------------------

  const APIFY_URL = 'https://api.apify.com/v2/acts/' + ACTOR_ID + '/run-sync-get-dataset-items?token=' + APIFY_TOKEN;

  const actorInput = {
    "hashtags": [],
    "profiles": [targetProfile],
    "scrollPage": false
  };

  try {
    return await fetch(APIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actorInput),
    }).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return response.json();
    }).then(results => {

      if (results.length > 0 && results[0].authorMeta && results[0].authorMeta.nickName) {
        return {
          "nickname": results[0].authorMeta.nickName,
          "avatar": results[0].authorMeta.avatar
        };
      } else {
        // Return the full JSON for debugging if the name isn't found
        return null;
      }
    });

  } catch (e) {
    console.log("Apps Script Execution Error: " + e.message);
    return {
      "nickname": e.message,
      "avatar": ""
    };
  }
}

async function storeOrderNo(orderNo) {
  const value = true;
  return await chrome.storage.local.set({ [orderNo]: value }).then(() => {
    console.log("orderNo is set to storage");
    return true;
  });
}

async function isExistStorageKey(key) {
  return await chrome.storage.local.get([key]).then((result) => {
    const isFound = result[key] !== undefined;
    return isFound;
  });
}

async function storeProfile(username, avatar, nickname) {
  const value = { avatar: avatar, nickname: nickname };
  return await chrome.storage.local.set({ [username]: value }).then(() => {
    console.log("profile is set to storage");
    return true;
  });
}

async function getStoredProfile(username) {
  return await chrome.storage.local.get([username]).then((result) => {
    return result[username];
  });
}

async function removeStorageKey(key) {
  return await chrome.storage.local.remove(key).then(() => {
    console.log(`${key} is removed from storage`);
    return true;
  });
}

function isImageCacheExceeded(inputTimeInSeconds) {
  const inputTimeInMs = inputTimeInSeconds * 1000;
  const currentTimeInMs = Date.now();
  return currentTimeInMs > inputTimeInMs;
}

function showDeleteAndReloadButton(orderNo) {
  const actionBtn = document.getElementById('loading-overlay-action-btn');
  if (actionBtn) {
    actionBtn.style.display = 'block';
    actionBtn.innerText = 'Delete & Reload';
    actionBtn.onclick = async function () {
      await removeStorageKey(orderNo);
      window.location.reload();
    };
  }
}