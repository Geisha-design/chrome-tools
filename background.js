chrome.runtime.onInstalled.addListener(function() {
  console.log('Google Label extension installed');
});

chrome.action.onClicked.addListener(function(tab) {
  console.log('Extension icon clicked');
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getDataStats') {
    getDataStats().then(stats => {
      sendResponse({ success: true, stats: stats });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'exportData') {
    exportData(request.format).then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

function getDataStats() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['scrapedData'], function(result) {
      const data = result.scrapedData || [];
      
      const stats = {
        totalItems: data.length,
        uniqueUrls: [...new Set(data.map(item => item.url))].length,
        attributes: [...new Set(data.map(item => item.attribute))],
        firstTimestamp: data.length > 0 ? data[0].timestamp : null,
        lastTimestamp: data.length > 0 ? data[data.length - 1].timestamp : null
      };
      
      resolve(stats);
    });
  });
}

function exportData(format) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['scrapedData'], function(result) {
      const data = result.scrapedData || [];
      
      if (data.length === 0) {
        reject(new Error('没有可导出的数据'));
        return;
      }
      
      let exportContent;
      
      if (format === 'json') {
        exportContent = JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        exportContent = convertToCSV(data);
      } else {
        reject(new Error('不支持的导出格式'));
        return;
      }
      
      resolve(exportContent);
    });
  });
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
