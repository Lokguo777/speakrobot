// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getVoices') {
    const voices = speechSynthesis.getVoices();
    sendResponse({ voices: voices });
  }
  return true;
}); 