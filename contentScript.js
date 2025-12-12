chrome.runtime.onMessage.addListener((msg) => {
  console.log(msg);
  switch (msg.data) {
    case 'copying':
      selectAllPage();
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
    navigator.clipboard.writeText(selection.toString())
      .then(() => {
        console.info("Text copied to clipboard");
      })
      .catch(err => {
        console.warn("Clipboard API failed, falling back to execCommand: ", err);
        // Fallback: document.execCommand("copy") is deprecated but works in some cases
        // where the Clipboard API fails (e.g., when triggered from background script without focus).
        try {
          document.execCommand("copy");
          console.info("Text copied using fallback execCommand");
        } catch (fallbackErr) {
          console.error("Fallback failed: ", fallbackErr);
        }
      });
  }
}
