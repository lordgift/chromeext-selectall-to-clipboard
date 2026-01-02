// 
// This is main script but background will trigger it on start.
// Debug this on running page. 
// 
// 

chrome.runtime.onMessage.addListener(async (msg) => {
  console.log(msg);
  switch (msg.data) {
    case 'copying':

      await openMaskingEyesInTikTokOrderDetail();

      const selectAllResult = await selectAllAndCopy();
      if (!selectAllResult) {
        console.error("Failed to select all page");
        return;
      }

      const formUrl = await extractClipboardData()

      console.log(`🎉 ${formUrl}`);
      break;

    default:
      console.warn("no case matches for ", msg.data);
      break;
  }
});

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
  await new Promise(resolve => setTimeout(resolve, 500));
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

      return await GET_TIKTOK_NAME_VIA_APIFY(`https://tiktok.com/@${userName}`).then((apifyFetched) => {
        console.log("Apify Result:", apifyFetched);

        const safeApifyFetched = apifyFetched || {
          "nickname": "Not Found",
          "avatar": ""
        };

        const tiktokAvatarFormula = `=IMAGE("${safeApifyFetched["avatar"]}")`;
        const tiktokNickname = safeApifyFetched["nickname"];

        const formUrl = `https://docs.google.com/forms/d/e/<GG_FORM_ID>/formResponse?entry.xxxx=${timeCreated}&entry.xxxxx=${orderNo}&entry.xxxx=${tiktokNickname}&entry.xxxx=${tiktokAvatarFormula}&entry.xxxx=${tiktokNickname}&entry.xxxx=${customerName}&entry.xxxx=${totalPrice}&entry.xxxxx=${paymentMethod}&submit=Submit`
        return formUrl;

      });


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

  // const APIFY_TOKEN = '<YOUR APIFY TOKEN>';
  // const ACTOR_ID = '<YOUR APIFY ACTOR ID>';


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