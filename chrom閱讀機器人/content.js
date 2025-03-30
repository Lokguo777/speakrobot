let utterance = null;
let speechSynthesis = window.speechSynthesis;

// 確保語音列表已加載
function loadVoices() {
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      };
    }
  });
}

// 初始化語音列表
loadVoices();

// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('收到消息:', request); // 調試信息

  if (request.action === 'startReading') {
    const selectedText = window.getSelection().toString().trim();
    console.log('選中的文字:', selectedText); // 調試信息

    if (selectedText) {
      stopReading();
      startReading(selectedText, request.voice);
      // 發送回應
      sendResponse({ success: true, message: '開始朗讀' });
    } else {
      console.log('沒有選中文字'); // 調試信息
      sendResponse({ success: false, message: '沒有選中文字' });
    }
  } else if (request.action === 'stopReading') {
    stopReading();
    sendResponse({ success: true, message: '停止朗讀' });
  }
  // 返回 true 表示會異步發送回應
  return true;
});

async function startReading(text, voiceName) {
  console.log('開始朗讀:', text); // 調試信息
  
  try {
    // 確保 speechSynthesis 處於活動狀態
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
    
    utterance = new SpeechSynthesisUtterance(text);
    
    // 等待語音列表加載
    const voices = await loadVoices();
    console.log('可用語音:', voices.map(v => `${v.name} (${v.lang})`)); // 調試信息
    
    // 設置語音
    if (voiceName) {
      const selectedVoice = voices.find(voice => voice.name === voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('使用語音:', selectedVoice.name, selectedVoice.lang); // 調試信息
      } else {
        // 如果找不到指定的語音，使用默認中文語音
        const chineseVoice = voices.find(voice => voice.lang.includes('zh'));
        if (chineseVoice) {
          utterance.voice = chineseVoice;
          console.log('使用默認中文語音:', chineseVoice.name, chineseVoice.lang);
        }
      }
    }

    // 設置其他參數
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = utterance.voice ? utterance.voice.lang : 'zh-TW';

    // 添加事件監聽器
    utterance.onstart = () => console.log('朗讀開始'); // 調試信息
    utterance.onend = () => console.log('朗讀結束'); // 調試信息
    utterance.onerror = (event) => console.error('朗讀錯誤:', event); // 調試信息

    // 確保在開始新的朗讀前取消所有正在進行的朗讀
    speechSynthesis.cancel();
    
    // 開始朗讀
    speechSynthesis.speak(utterance);

    // 防止 Chrome 的錯誤導致語音停止
    const preventSpeechBug = setInterval(() => {
      if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        speechSynthesis.resume();
      } else {
        clearInterval(preventSpeechBug);
      }
    }, 10000);
  } catch (error) {
    console.error('朗讀出錯:', error); // 調試信息
  }
}

function stopReading() {
  try {
    if (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused) {
      console.log('停止朗讀'); // 調試信息
      speechSynthesis.cancel();
    }
  } catch (error) {
    console.error('停止朗讀時出錯:', error);
  }
} 