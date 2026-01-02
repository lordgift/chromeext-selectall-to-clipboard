// 
// This is main script but background will trigger it on start.
// Debug this on running page. 
// 
// 


chrome.runtime.onMessage.addListener(async (msg) => {
  console.log(msg);
  switch (msg.data) {
    case 'copying':

      openMaskingEyesInTikTokOrderDetail();

      setTimeout(selectAllPage, 1000);

      setTimeout(openOrFindTab, 2000);


      recordDataFromOrderDetail().then((val) => {
        console.log(`🎉 ${val}`);
        publishMessageToSubmitForm(val);
      });
      break;

    default:
      console.warn("no case matches for ", msg.data);
      break;
  }
});

function selectAllPage() {
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
    navigator.clipboard
      .writeText(selection.toString())
      .then(() => {
        console.log("successfully copied");
      })
      .catch((err) => {
        console.error("Fallback failed: ", err);
      });
  }
}


function openMaskingEyesInTikTokOrderDetail() {
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
}


function publishMessageToOpenTab(tabJson) {
  chrome.runtime.sendMessage({
    action: 'openOrFindTab',
    title: tabJson.title,
    url: tabJson.url
  });
}

function publishMessageToSubmitForm(formUrl) {
  chrome.runtime.sendMessage({
    action: 'executeAPI',
    url: formUrl,
    method: 'GET'
  });
}

async function recordDataFromOrderDetail() {
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

      // The first line of the address (Customer Name)
      const customerName = shippingAddressMatch[1].trim();

      // Optional: Log extracted data for debugging
      console.log(`Order No: ${orderNo}`);
      console.log(`Customer Name: ${customerName}`);


      // 2. Prepare formulas and values
      const orderNoFormula = `=HYPERLINK("https://seller-th.tiktok.com/order/detail?order_no=${orderNo}&shop_region=TH", "${orderNo}")`;
      const userProfileFormula = `=HYPERLINK("https://tiktok.com/@${userName}", "${userName}")`;

      const paymentMethod = paymentMethodMatch[1].trim();
      const totalPrice = totalPriceMatch[1].trim();


      // MOCK apify
      const apifyFetched = {
        "nickname": "mockup name",
        "avatar": "https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_v914OURMOFkGw9MuHgvOeZJsIepdWQ7nfhVC753DYBUgKSvnn8JCeRTUo-Mw7bPay71wMmugrSkeVTf0LOl1526MpZwNGTklJRl-8fyjO2zduprslFqojel-VjZDYbqL4jN1-IbDhCXy2BkHid-x2yUgCeORuZYbFIg4M=w128-h128-p-k-no-nu"
      };
      // const apifyFetched = GET_TIKTOK_NAME_VIA_APIFY(`https://tiktok.com/@${userName}`);
      const tiktokAvatarFormula = `=IMAGE("${apifyFetched["avatar"]}")`;
      const tiktokNickname = apifyFetched["nickname"];

      const formUrl = `https://docs.google.com/forms/d/e/<GG_FORM_ID>/formResponse?entry.xxxx=${timeCreated}&entry.xxxxx=${orderNo}&entry.xxxx=${tiktokNickname}&entry.xxxx=${tiktokAvatarFormula}&entry.xxxx=${tiktokNickname}&entry.xxxx=${customerName}&entry.xxxx=${totalPrice}&entry.xxxxx=${paymentMethod}&submit=Submit`
      return formUrl;

    } else {
      // extracting error
      let errorMsg = "Could not find all required patterns in the pasted text.\n\n";
      errorMsg += `Order No Found: ${!!orderNoMatch}\n`;
      errorMsg += `Time Created Found: ${!!timeCreatedMatch}\n`;
      errorMsg += `User Name Found: ${!!userNameMatch}\n`;
      errorMsg += `Customer Name Found: ${!!shippingAddressMatch}`;
      errorMsg += `Total Price Found: ${!!totalPriceMatch}`;
      errorMsg += `Payment Method Found: ${!!paymentMethodMatch}`;
      console.error(errorMsg);
      return null
    }


  } catch (error) {
    console.error(error);
    return null;
  }

}