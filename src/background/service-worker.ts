// Service worker for YouTube Feed Control (MV3)
console.log('[YFC] Service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[YFC] Extension installed');
});
