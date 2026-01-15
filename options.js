document.addEventListener('DOMContentLoaded', function() {
  const refreshBtn = document.getElementById('refreshBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const clearBtn = document.getElementById('clearBtn');
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const loading = document.getElementById('loading');

  loadData();

  refreshBtn.addEventListener('click', loadData);

  exportJsonBtn.addEventListener('click', function() {
    chrome.storage.local.get(['scrapedData'], function(result) {
      const data = result.scrapedData || [];
      if (data.length === 0) {
        alert('没有可导出的数据');
        return;
      }
      downloadFile(JSON.stringify(data, null, 2), 'scraped_data.json', 'application/json');
    });
  });

  exportCsvBtn.addEventListener('click', function() {
    chrome.storage.local.get(['scrapedData'], function(result) {
      const data = result.scrapedData || [];
      if (data.length === 0) {
        alert('没有可导出的数据');
        return;
      }
      const csvContent = convertToCSV(data);
      downloadFile(csvContent, 'scraped_data.csv', 'text/csv');
    });
  });

  clearBtn.addEventListener('click', function() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      chrome.storage.local.clear(function() {
        loadData();
        alert('数据已清除');
      });
    }
  });

  function loadData() {
    loading.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    chrome.storage.local.get(['scrapedData'], function(result) {
      const data = result.scrapedData || [];
      
      updateStats(data);
      
      if (data.length === 0) {
        emptyState.style.display = 'block';
        loading.style.display = 'none';
        return;
      }

      data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.index}</td>
          <td class="url-cell" title="${item.url}">${item.url}</td>
          <td class="path-cell" title="${item.tagName}${item.id ? '#' + item.id : ''}${item.className ? '.' + item.className : ''}">${item.tagName}${item.id ? '#' + item.id : ''}${item.className ? '.' + item.className : ''}</td>
          <td>${item.attribute}</td>
          <td class="value-cell" title="${item.value}">${item.value}</td>
          <td class="position-cell">${item.position ? `(${item.position.left}, ${item.position.top})` : '-'}</td>
          <td>${formatTimestamp(item.timestamp)}</td>
          <td><button class="expand-btn" data-index="${index}">详情</button></td>
        `;
        tableBody.appendChild(row);

        const detailRow = document.createElement('tr');
        detailRow.className = 'detail-row';
        detailRow.id = `detail-${index}`;
        detailRow.innerHTML = `
          <td colspan="8">
            <div class="detail-content">
              <div class="detail-item">
                <span class="detail-label">XPath:</span>
                <span class="detail-value">${item.xpath || '-'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">CSS路径:</span>
                <span class="detail-value">${item.cssPath || '-'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">位置:</span>
                <span class="detail-value">Top: ${item.position?.top || 0}px, Left: ${item.position?.left || 0}px, Width: ${item.position?.width || 0}px, Height: ${item.position?.height || 0}px</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">元素ID:</span>
                <span class="detail-value">${item.id || '-'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">类名:</span>
                <span class="detail-value">${item.className || '-'}</span>
              </div>
            </div>
          </td>
        `;
        tableBody.appendChild(detailRow);
      });

      loading.style.display = 'none';

      document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = this.getAttribute('data-index');
          const detailRow = document.getElementById(`detail-${index}`);
          
          if (detailRow.classList.contains('show')) {
            detailRow.classList.remove('show');
            this.textContent = '详情';
          } else {
            detailRow.classList.add('show');
            this.textContent = '收起';
          }
        });
      });
    });
  }

  function updateStats(data) {
    document.getElementById('totalItems').textContent = data.length;
    document.getElementById('uniqueUrls').textContent = [...new Set(data.map(item => item.url))].length;
    document.getElementById('attributes').textContent = [...new Set(data.map(item => item.attribute))].length;
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
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