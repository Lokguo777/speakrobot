document.addEventListener('DOMContentLoaded', async function() {
  const voiceSelect = document.getElementById('voiceSelect');
  const startButton = document.getElementById('startReading');
  const stopButton = document.getElementById('stopReading');
  const statusDiv = document.createElement('div');
  document.body.appendChild(statusDiv);

  // 設置狀態顯示的樣式
  statusDiv.style.marginTop = '10px';
  statusDiv.style.padding = '5px';
  statusDiv.style.borderRadius = '4px';
  
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
    statusDiv.style.color = isError ? '#c62828' : '#2e7d32';
  }

  // 獲取可用的語音列表
  try {
    const voices = await new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        resolve(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve(voices);
        };
      }
    });

    // 過濾出中文語音
    const chineseVoices = voices.filter(voice => voice.lang.includes('zh'));
    
    // 如果有中文語音，優先顯示
    const voicesToShow = chineseVoices.length > 0 ? chineseVoices : voices;

    // 填充語音選擇下拉選單
    voicesToShow.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });
    
    console.log('語音列表已加載:', voicesToShow.length, '個語音'); // 調試信息
    
    if (voicesToShow.length === 0) {
      showStatus('警告：未找到可用的語音', true);
    }
  } catch (error) {
    console.error('加載語音列表時出錯:', error); // 調試信息
    showStatus('加載語音列表失敗', true);
  }

  // 開始朗讀按鈕點擊事件
  startButton.addEventListener('click', function() {
    const selectedVoice = voiceSelect.value;
    console.log('選擇的語音:', selectedVoice); // 調試信息

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        console.log('發送開始朗讀消息到標籤頁:', tabs[0].id); // 調試信息
        startButton.disabled = true;
        showStatus('正在開始朗讀...');
        
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'startReading',
          voice: selectedVoice
        }, function(response) {
          startButton.disabled = false;
          if (chrome.runtime.lastError) {
            console.error('發送消息時出錯:', chrome.runtime.lastError); // 調試信息
            showStatus('無法開始朗讀，請重新整理頁面後再試', true);
          } else if (response && response.success) {
            showStatus(response.message);
          } else if (response) {
            showStatus(response.message, true);
          }
        });
      } else {
        console.error('未找到活動標籤頁'); // 調試信息
        showStatus('未找到活動頁面', true);
      }
    });
  });

  // 停止朗讀按鈕點擊事件
  stopButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        console.log('發送停止朗讀消息到標籤頁:', tabs[0].id); // 調試信息
        stopButton.disabled = true;
        showStatus('正在停止朗讀...');
        
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'stopReading'
        }, function(response) {
          stopButton.disabled = false;
          if (chrome.runtime.lastError) {
            console.error('發送消息時出錯:', chrome.runtime.lastError); // 調試信息
            showStatus('無法停止朗讀', true);
          } else if (response && response.success) {
            showStatus(response.message);
          }
        });
      }
    });
  });
}); 