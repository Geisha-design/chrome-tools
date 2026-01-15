document.addEventListener('DOMContentLoaded', function() {
  const scrapeBtn = document.getElementById('scrapeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');
  const selectModeToggle = document.getElementById('selectModeToggle');
  const boxSelectToggle = document.getElementById('boxSelectToggle');
  const templateSelect = document.getElementById('templateSelect');
  const selectorInput = document.getElementById('selectorInput');
  const attributeInput = document.getElementById('attributeInput');
  const statusDiv = document.getElementById('status');
  const dataCountDiv = document.getElementById('dataCount');
  const selectorPreview = document.getElementById('selectorPreview');
  const alwaysHoverToggle = document.getElementById('alwaysHoverToggle');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const autoSendToggle = document.getElementById('autoSendToggle');
  const apiStatusDiv = document.getElementById('apiStatus');
  const boxSelectionInfo = document.getElementById('boxSelectionInfo');

  updateDataCount();
  loadAlwaysHoverState();
  loadApiConfig();
  loadModeStates();

  templateSelect.addEventListener('change', function() {
    const template = templateSelect.value;
    if (template && template !== 'custom') {
      selectorInput.value = template;
      showStatus('已应用模板: ' + templateSelect.options[templateSelect.selectedIndex].text, 'success');
    }
  });

  selectModeToggle.addEventListener('change', function() {
    const enabled = selectModeToggle.checked;
    chrome.storage.local.set({ selectModeEnabled: enabled });
    
    if (enabled) {
      enterSelectMode();
      showStatus('点击选择模式已开启', 'info');
    } else {
      stopSelectMode();
      showStatus('点击选择模式已关闭', 'info');
    }
  });

  boxSelectToggle.addEventListener('change', function() {
    const enabled = boxSelectToggle.checked;
    chrome.storage.local.set({ boxSelectModeEnabled: enabled });
    
    if (enabled) {
      enterBoxSelectMode();
      showStatus('框选模式已开启', 'info');
    } else {
      stopBoxSelectMode();
      showStatus('框选模式已关闭', 'info');
    }
  });

  alwaysHoverToggle.addEventListener('change', function() {
    const enabled = alwaysHoverToggle.checked;
    chrome.storage.local.set({ alwaysHoverMode: enabled });
    
    if (enabled) {
      enterSelectMode();
      showStatus('始终悬停模式已开启', 'info');
    } else {
      exitSelectMode();
      showStatus('始终悬停模式已关闭', 'info');
    }
  });

  autoSendToggle.addEventListener('change', function() {
    const enabled = autoSendToggle.checked;
    chrome.storage.local.set({ autoSendToApi: enabled });
  });

  apiUrlInput.addEventListener('change', function() {
    const url = apiUrlInput.value.trim();
    chrome.storage.local.set({ apiUrl: url });
  });

  function loadAlwaysHoverState() {
    chrome.storage.local.get(['alwaysHoverMode'], function(result) {
      if (result.alwaysHoverMode) {
        alwaysHoverToggle.checked = true;
        enterSelectMode();
      }
    });
  }

  function loadApiConfig() {
    chrome.storage.local.get(['apiUrl', 'autoSendToApi'], function(result) {
      if (result.apiUrl) {
        apiUrlInput.value = result.apiUrl;
      }
      if (result.autoSendToApi) {
        autoSendToggle.checked = true;
      }
    });
  }

  selectElementBtn.addEventListener('click', function() {
    if (isSelectMode) {
      exitSelectMode();
    } else {
      enterSelectMode();
    }
  });

  function enterSelectMode() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      chrome.tabs.sendMessage(activeTab.id, { action: 'startSelectMode' }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('请刷新页面后重试', 'error');
        } else if (response && response.success) {
          isSelectMode = true;
          selectElementBtn.textContent = '❌ 退出选择模式';
          selectElementBtn.style.backgroundColor = '#dc3545';
          if (!alwaysHoverToggle.checked) {
            showStatus('请在页面上点击要抓取的元素', 'info');
          }
        }
      });
    });
  }

  function exitSelectMode() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      chrome.tabs.sendMessage(activeTab.id, { action: 'stopSelectMode' }, function(response) {
        isSelectMode = false;
        selectElementBtn.textContent = '🎯 点击选择元素';
        selectElementBtn.style.backgroundColor = '#ff9800';
        selectorPreview.style.display = 'none';
      });
    });
  }

  function enterBoxSelectMode() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      chrome.tabs.sendMessage(activeTab.id, { action: 'startBoxSelectMode' }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('请刷新页面后重试', 'error');
        } else if (response && response.success) {
          isBoxSelectMode = true;
          boxSelectBtn.textContent = '❌ 退出框选模式';
          boxSelectBtn.style.backgroundColor = '#dc3545';
          showStatus('请在页面上拖拽框选要抓取的元素', 'info');
        }
      });
    });
  }

  function exitBoxSelectMode() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      chrome.tabs.sendMessage(activeTab.id, { action: 'stopBoxSelectMode' }, function(response) {
        isBoxSelectMode = false;
        boxSelectBtn.textContent = '📦 框选模式';
        boxSelectBtn.style.backgroundColor = '#9c27b0';
        boxSelectionInfo.style.display = 'none';
      });
    });
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'elementSelected') {
      selectorInput.value = request.selector;
      selectorPreview.textContent = `已选择: ${request.tagName} ${request.className ? '.' + request.className : ''}`;
      selectorPreview.style.display = 'block';
      
      if (!alwaysHoverToggle.checked) {
        exitSelectMode();
      }
      
      showStatus('元素已选择', 'success');
    } else if (request.action === 'boxSelectionComplete') {
      boxSelectionInfo.textContent = `已框选 ${request.count} 个元素`;
      boxSelectionInfo.style.display = 'block';
      
      if (request.selector) {
        selectorInput.value = request.selector;
      }
      
      exitBoxSelectMode();
      showStatus(`框选完成，共 ${request.count} 个元素`, 'success');
    }
  });

  scrapeBtn.addEventListener('click', function() {
    const selector = selectorInput.value.trim();
    const attribute = attributeInput.value.trim();

    if (!selector) {
      showStatus('请输入CSS选择器', 'error');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      chrome.tabs.sendMessage(activeTab.id, { 
        action: 'scrape',
        selector: selector,
        attribute: attribute
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('请刷新页面后重试', 'error');
        } else if (response && response.success) {
          showStatus(`成功抓取 ${response.count} 条数据`, 'success');
          updateDataCount();
          
          if (autoSendToggle.checked) {
            sendToApi(response.data);
          }
        } else {
          showStatus('抓取失败: ' + (response ? response.error : '未知错误'), 'error');
        }
      });
    });
  });

  async function sendToApi(data) {
    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
      showStatus('请配置API地址', 'error');
      return;
    }

    showApiStatus('sending', '正在发送数据到API...');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      });

      if (response.ok) {
        showApiStatus('success', '数据已成功发送到API');
        setTimeout(() => {
          apiStatusDiv.style.display = 'none';
        }, 3000);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      showApiStatus('error', `发送失败: ${error.message}`);
    }
  }

  function showApiStatus(type, message) {
    apiStatusDiv.textContent = message;
    apiStatusDiv.className = `api-status ${type}`;
    apiStatusDiv.style.display = 'block';
  }

  clearBtn.addEventListener('click', function() {
    chrome.storage.local.clear(function() {
      showStatus('数据已清除', 'success');
      updateDataCount();
    });
  });

  exportBtn.addEventListener('click', function() {
    chrome.storage.local.get(['scrapedData'], function(result) {
      const data = result.scrapedData || [];
      
      if (data.length === 0) {
        showStatus('没有可导出的数据', 'error');
        return;
      }

      const csvContent = convertToCSV(data);
      downloadFile(csvContent, 'scraped_data.csv', 'text/csv');
      showStatus('数据已导出', 'success');
    });
  });

  function updateDataCount() {
    chrome.storage.local.get(['scrapedData'], function(result) {
      const data = result.scrapedData || [];
      dataCountDiv.textContent = `已抓取: ${data.length} 条数据`;
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }

  function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        const escaped = value.toString().replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
