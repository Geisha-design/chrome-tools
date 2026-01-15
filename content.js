const TARGET_URL = 'https://www.evergreen-shipping.cn/servlet/TUF1_ControllerServlet.do';
const TABLE_SELECTOR = '#eeb1_bookingList > table.Design1';

function checkUrlAndScrape() {
  console.log('Checking URL:', window.location.href);
  
  if (window.location.href.includes(TARGET_URL)) {
    console.log('Target URL matched, starting auto-scrape...');
    
    setTimeout(() => {
      scrapeAndExport();
    }, 2000);
  }
}

function scrapeAndExport() {
  console.log('Scraping table data...');
  
  const table = document.querySelector(TABLE_SELECTOR);
  
  if (!table) {
    console.error('Table not found with selector:', TABLE_SELECTOR);
    return;
  }
  
  const data = [];
  const rows = table.querySelectorAll('tbody tr');
  
  console.log('Found', rows.length, 'rows');
  
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    const rowData = {
      rowIndex: rowIndex + 1
    };
    
    cells.forEach((cell, cellIndex) => {
      const cellKey = `column_${cellIndex + 1}`;
      rowData[cellKey] = cell.textContent.trim();
    });
    
    data.push(rowData);
  });
  
  console.log('Scraped', data.length, 'rows of data');
  
  if (data.length > 0) {
    exportToCSV(data);
  } else {
    console.warn('No data to export');
  }
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkUrlAndScrape);
} else {
  checkUrlAndScrape();
}

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkUrlAndScrape();
  }
}).observe(document, { subtree: true, childList: true });
