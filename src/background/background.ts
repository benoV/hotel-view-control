chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  void chrome.tabs.sendMessage(tab.id, { type: "hvc:toggle-panel" }).catch(() => {
    // The extension only runs on Agoda and Booking.com pages, so no panel is available elsewhere.
  });
});
