# Select n Copy for TikTok Seller

[![](https://img.shields.io/badge/Google_Chrome-Extensions-4285F4?logo=google-chrome&logoColor=4285F4)](chrome://extensions)
![](https://img.shields.io/badge/language-javascript-f7df1e?logo=javascript)


Easier copy whole page of TikTok's order detail then extract data and submit to Google Form immediately.


📌 Easier if you pin it to Google Chrome's toolbar.

## Installation

To experiment with these samples, please clone this repo and use 'Load Unpacked Extension'.
Read more on [Development Basics](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).


## Prerequisite
- New [Google Form](https://forms.google.com/) required with following fields:
    - Time Created
    - Order Number
    - User Name
    - TikTok ID
    - TikTok Avatar
    - TikTok Nickname
    - Customer Name
    - Total Price
    - Payment Method
- [ApiFy](https://console.apify.com/) account required to scrape TikTok user profile.

## Setting Up

- using Google Form's pre-fill form, you'll get link with query string.
- Make sure pattern should be like this:
```
https://docs.google.com/forms/d/e/<GG_FORM_ID>/formResponse?entry.xxxx=${timeCreated}&entry.xxxxx=${orderNo}&entry.xxxx=${tiktokNickname}&entry.xxxx=${tiktokAvatarFormula}&entry.xxxx=${tiktokNickname}&entry.xxxx=${customerName}&entry.xxxx=${totalPrice}&entry.xxxxx=${paymentMethod}&submit=Submit
```
- `View in Sheets` to go to Google Sheet.
- setup ➕ new Sheets to be **👀 Virtual Sheet** for reformat data that you'd like to see.
