const TARGET_URL = 'https://www.evergreen-shipping.cn/servlet/TUF1_ControllerServlet.do';
const TABLE_SELECTOR = '#eeb1_bookingList > table.Design1';
const WS_URL = 'ws://localhost:3000';

let allData = [];
let currentPage = 1;
let isProcessing = false;
let shouldStop = false;
let ws = null;

function connectWebSocket() {
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = function() {
      console.log('WebSocket已连接到服务器');
      sendStatus();
    };
    
    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        console.log('收到服务器消息:', data);
        
        switch(data.type) {
          case 'START':
            console.log('收到START指令');
            startScraping();
            break;
          case 'STOP':
            console.log('收到STOP指令');
            shouldStop = true;
            isProcessing = false;
            console.log('Scraping stopped by server');
            break;
          case 'EXPORT':
            console.log('收到EXPORT指令');
            if (allData.length > 0) {
              exportToCSV(allData);
              exportToJSON(allData);
            } else {
              console.warn('No data to export');
            }
            break;
          case 'CLEAR':
            console.log('收到CLEAR指令');
            allData = [];
            currentPage = 1;
            isProcessing = false;
            shouldStop = false;
            console.log('Data cleared by server');
            break;
          case 'STATUS':
            console.log('收到STATUS指令');
            sendStatus();
            break;
          case 'SCRAPE_CURRENT_PAGE':
            console.log('收到SCRAPE_CURRENT_PAGE指令');
            scrapeCurrentPage();
            break;
        }
      } catch (error) {
        console.error('解析服务器消息失败:', error);
      }
    };
    
    ws.onclose = function() {
      console.log('WebSocket连接已关闭，5秒后重连...');
      setTimeout(connectWebSocket, 5000);
    };
    
    ws.onerror = function(error) {
      console.error('WebSocket错误:', error);
    };
  } catch (error) {
    console.error('WebSocket连接失败:', error);
    setTimeout(connectWebSocket, 5000);
  }
}

function sendStatus() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const status = {
      type: 'STATUS_UPDATE',
      data: {
        isProcessing: isProcessing,
        currentPage: currentPage,
        totalRecords: allData.length,
        shouldStop: shouldStop,
        timestamp: new Date().toISOString()
      }
    };
    ws.send(JSON.stringify(status));
  }
}

function sendProgress(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const progress = {
      type: 'PROGRESS',
      data: {
        message: message,
        isProcessing: isProcessing,
        currentPage: currentPage,
        totalRecords: allData.length,
        timestamp: new Date().toISOString()
      }
    };
    ws.send(JSON.stringify(progress));
  }
}

connectWebSocket();

window.GoogleLabelExtension = {
  start: function() {
    console.log('GoogleLabelExtension.start() called');
    startScraping();
  },
  
  stop: function() {
    console.log('GoogleLabelExtension.stop() called');
    shouldStop = true;
    isProcessing = false;
    console.log('Scraping stopped by user');
  },
  
  export: function() {
    console.log('GoogleLabelExtension.export() called');
    if (allData.length > 0) {
      exportToCSV(allData);
      exportToJSON(allData);
    } else {
      console.warn('No data to export');
    }
  },
  
  clear: function() {
    console.log('GoogleLabelExtension.clear() called');
    allData = [];
    currentPage = 1;
    isProcessing = false;
    shouldStop = false;
    console.log('Data cleared');
  },
  
  getStatus: function() {
    return {
      isProcessing: isProcessing,
      currentPage: currentPage,
      totalRecords: allData.length,
      shouldStop: shouldStop
    };
  },
  
  scrapeCurrentPage: function() {
    console.log('GoogleLabelExtension.scrapeCurrentPage() called');
    scrapeCurrentPage();
  }
};

window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  
  console.log('Received message:', event.data);
  
  if (event.data.type === 'GOOGLE_LABEL_START') {
    startScraping();
  } else if (event.data.type === 'GOOGLE_LABEL_STOP') {
    shouldStop = true;
    isProcessing = false;
    console.log('Scraping stopped by message');
  } else if (event.data.type === 'GOOGLE_LABEL_EXPORT') {
    if (allData.length > 0) {
      exportToCSV(allData);
      exportToJSON(allData);
    } else {
      console.warn('No data to export');
    }
  } else if (event.data.type === 'GOOGLE_LABEL_CLEAR') {
    allData = [];
    currentPage = 1;
    isProcessing = false;
    shouldStop = false;
    console.log('Data cleared by message');
  } else if (event.data.type === 'GOOGLE_LABEL_STATUS') {
    const status = {
      isProcessing: isProcessing,
      currentPage: currentPage,
      totalRecords: allData.length,
      shouldStop: shouldStop
    };
    window.postMessage({ type: 'GOOGLE_LABEL_STATUS_RESPONSE', data: status }, '*');
  }
});

window.dispatchEvent(new CustomEvent('GoogleLabelExtensionReady', {
  detail: { version: '2.0', api: 'GoogleLabelExtension' }
}));

function checkUrlAndScrape() {
  console.log('Checking URL:', window.location.href);
  
  if (window.location.href.includes(TARGET_URL)) {
    console.log('Target URL matched, starting auto-scrape...');
    
    setTimeout(() => {
      startScraping();
    }, 5000);
  }
}

function startScraping() {
  if (isProcessing) {
    console.log('Already processing, skipping...');
    return;
  }
  
  isProcessing = true;
  allData = [];
  currentPage = 1;
  
  console.log('Starting multi-page scraping...');
  sendProgress('开始多页抓取...');
  scrapeCurrentPage();
}

function scrapeCurrentPage() {
  console.log(`Scraping page ${currentPage}...`);
  sendProgress(`正在抓取第 ${currentPage} 页...`);
  
  const table = document.querySelector(TABLE_SELECTOR);
  
  if (!table) {
    console.error('Table not found with selector:', TABLE_SELECTOR);
    sendProgress('未找到表格，抓取失败');
    exportAndFinish();
    return;
  }
  
  console.log('Table found:', table);
  
  const tbody = table.querySelector('tbody');
  
  if (!tbody) {
    console.error('tbody not found');
    sendProgress('未找到表格主体，抓取失败');
    exportAndFinish();
    return;
  }
  
  console.log('tbody found');
  
  const rows = tbody.querySelectorAll('tr');
  console.log('Found', rows.length, 'rows on page', currentPage);
  
  if (rows.length === 0) {
    console.warn('No rows found in tbody');
    sendProgress('当前页没有数据行');
    exportAndFinish();
    return;
  }
  
  const pageData = [];
  
  rows.forEach((row, rowIndex) => {
    const rowData = {
      rowIndex: allData.length + rowIndex + 1,
      page: currentPage
    };
    
    const cells = row.querySelectorAll('td');
    console.log(`Row ${rowIndex + 1}: Found ${cells.length} td cells`);
    
    cells.forEach((cell, cellIndex) => {
      const cellKey = `column_${cellIndex + 1}`;
      const cellText = cell.textContent.trim();
      
      if (cellIndex === 2) {
        const brElements = cell.querySelectorAll('br');
        const parts = cell.innerHTML.split('<br>');
        console.log(`    Column 3 has ${brElements.length} br elements, splitting into ${parts.length} parts`);
        
        for (let i = 0; i < 4; i++) {
          const partKey = `column_3_part_${i + 1}`;
          rowData[partKey] = parts[i] ? parts[i].trim() : '';
          console.log(`      ${partKey}: "${rowData[partKey]}"`);
        }
      } else if (cellIndex === 3) {
        const brElements = cell.querySelectorAll('br');
        const parts = cell.innerHTML.split('<br>');
        console.log(`    Column 4 has ${brElements.length} br elements, splitting into ${parts.length} parts`);
        
        for (let i = 0; i < 4; i++) {
          const partKey = `column_4_part_${i + 1}`;
          rowData[partKey] = parts[i] ? parts[i].trim() : '';
          console.log(`      ${partKey}: "${rowData[partKey]}"`);
        }
      } else {
        rowData[cellKey] = cellText;
        console.log(`  ${cellKey}: "${cellText}"`);
      }
    });
    
    pageData.push(rowData);
  });
  
  allData = allData.concat(pageData);
  console.log(`Page ${currentPage} scraped, total records: ${allData.length}`);
  sendProgress(`第 ${currentPage} 页抓取完成，共 ${allData.length} 条记录`);
  sendStatus();
  
  checkAndGoToNextPage();
}

function checkAndGoToNextPage() {
  let nextButtonSelector;
  
  if (currentPage === 1) {
    nextButtonSelector = '#eeb1_bookingList > table:nth-child(2) > tbody > tr > td:nth-child(3) > a:nth-child(1)';
  } else {
    nextButtonSelector = '#eeb1_bookingList > table:nth-child(2) > tbody > tr > td:nth-child(3) > a:nth-child(3)';
  }
  
  console.log(`Using selector for page ${currentPage}:`, nextButtonSelector);
  
  const nextButton = document.querySelector(nextButtonSelector);
  
  if (!nextButton) {
    console.log('No next page button found, scraping complete');
    exportAndFinish();
    return;
  }
  
  console.log('Next page button found:', nextButton);
  console.log('Next button text:', nextButton.textContent.trim());
  
  if (nextButton.textContent.trim() === '' || nextButton.disabled) {
    console.log('Next button is disabled or empty, scraping complete');
    exportAndFinish();
    return;
  }
  
  console.log('Clicking next page button...');
  nextButton.click();
  
  currentPage++;
  
  setTimeout(() => {
    scrapeCurrentPage();
  }, 5000);
}

function exportAndFinish() {
  console.log('Exporting all data...');
  console.log('Total records:', allData.length);
  sendProgress('开始导出数据...');
  
  if (allData.length === 0) {
    console.warn('No data to export');
    sendProgress('没有数据可导出');
    isProcessing = false;
    sendStatus();
    return;
  }
  
  exportToCSV(allData);
  exportToJSON(allData);
  sendProgress(`导出完成，共 ${allData.length} 条记录`);
  isProcessing = false;
  sendStatus();
}

function exportToCSV(data) {
  console.log('Exporting to CSV...');
  
  if (data.length === 0) {
    console.error('No data to export');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      const escaped = value.toString().replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `booking_data_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('CSV exported successfully');
}

function exportToJSON(data) {
  console.log('Exporting to JSON...');
  
  if (data.length === 0) {
    console.error('No data to export');
    return;
  }
  
  const jsonContent = JSON.stringify(data, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `booking_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('JSON exported successfully');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkUrlAndScrape);
} else {
  checkUrlAndScrape();
}

let lastUrl = location.href;
const observer = new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkUrlAndScrape();
  }
});
observer.observe(document, { subtree: true, childList: true });
