# Google Label Extension - 外部调用接口说明

## 接口概述

插件提供了一个全局API对象 `window.GoogleLabelExtension`，可以通过多种方式调用插件功能。

## API 方法

### 1. start() - 开始抓取

开始自动抓取所有页面数据。

```javascript
window.GoogleLabelExtension.start();
```

**功能**：
- 重置数据
- 从当前页开始抓取
- 自动翻页直到最后一页
- 完成后自动导出CSV和JSON

**示例**：
```javascript
// 在浏览器控制台中执行
window.GoogleLabelExtension.start();

// 或者通过消息调用
window.postMessage({ type: 'GOOGLE_LABEL_START' }, '*');
```

---

### 2. stop() - 停止抓取

立即停止当前的抓取过程。

```javascript
window.GoogleLabelExtension.stop();
```

**功能**：
- 停止当前抓取
- 保留已抓取的数据
- 不会自动导出

**示例**：
```javascript
// 在浏览器控制台中执行
window.GoogleLabelExtension.stop();

// 或者通过消息调用
window.postMessage({ type: 'GOOGLE_LABEL_STOP' }, '*');
```

---

### 3. export() - 导出数据

导出当前已抓取的数据为CSV和JSON格式。

```javascript
window.GoogleLabelExtension.export();
```

**功能**：
- 导出CSV文件
- 导出JSON文件
- 保留所有已抓取的数据

**示例**：
```javascript
// 在浏览器控制台中执行
window.GoogleLabelExtension.export();

// 或者通过消息调用
window.postMessage({ type: 'GOOGLE_LABEL_EXPORT' }, '*');
```

---

### 4. clear() - 清除数据

清除所有已抓取的数据。

```javascript
window.GoogleLabelExtension.clear();
```

**功能**：
- 清空所有数据
- 重置页码
- 重置处理状态

**示例**：
```javascript
// 在浏览器控制台中执行
window.GoogleLabelExtension.clear();

// 或者通过消息调用
window.postMessage({ type: 'GOOGLE_LABEL_CLEAR' }, '*');
```

---

### 5. getStatus() - 获取状态

获取当前抓取状态。

```javascript
const status = window.GoogleLabelExtension.getStatus();
```

**返回值**：
```javascript
{
  isProcessing: boolean,    // 是否正在抓取
  currentPage: number,       // 当前页码
  totalRecords: number,      // 已抓取记录数
  shouldStop: boolean        // 是否应该停止
}
```

**示例**：
```javascript
// 在浏览器控制台中执行
const status = window.GoogleLabelExtension.getStatus();
console.log('当前状态:', status);

// 或者通过消息调用
window.postMessage({ type: 'GOOGLE_LABEL_STATUS' }, '*');

// 监听响应
window.addEventListener('message', function(event) {
  if (event.data.type === 'GOOGLE_LABEL_STATUS_RESPONSE') {
    console.log('状态响应:', event.data.data);
  }
});
```

---

### 6. scrapeCurrentPage() - 抓取当前页

只抓取当前页面，不进行翻页。

```javascript
window.GoogleLabelExtension.scrapeCurrentPage();
```

**功能**：
- 只抓取当前页数据
- 不自动翻页
- 适合手动控制翻页的场景

**示例**：
```javascript
// 在浏览器控制台中执行
window.GoogleLabelExtension.scrapeCurrentPage();
```

---

## 调用方式

### 方式1：直接调用API

```javascript
// 打开目标网页
// 按F12打开控制台
// 执行以下命令

// 开始抓取
window.GoogleLabelExtension.start();

// 停止抓取
window.GoogleLabelExtension.stop();

// 导出数据
window.GoogleLabelExtension.export();

// 清除数据
window.GoogleLabelExtension.clear();

// 获取状态
const status = window.GoogleLabelExtension.getStatus();
console.log(status);
```

---

### 方式2：通过postMessage调用

```javascript
// 开始抓取
window.postMessage({ type: 'GOOGLE_LABEL_START' }, '*');

// 停止抓取
window.postMessage({ type: 'GOOGLE_LABEL_STOP' }, '*');

// 导出数据
window.postMessage({ type: 'GOOGLE_LABEL_EXPORT' }, '*');

// 清除数据
window.postMessage({ type: 'GOOGLE_LABEL_CLEAR' }, '*');

// 获取状态
window.postMessage({ type: 'GOOGLE_LABEL_STATUS' }, '*');

// 监听状态响应
window.addEventListener('message', function(event) {
  if (event.data.type === 'GOOGLE_LABEL_STATUS_RESPONSE') {
    console.log('状态:', event.data.data);
  }
});
```

---

### 方式3：从外部网页调用

```html
<!DOCTYPE html>
<html>
<head>
  <title>控制面板</title>
</head>
<body>
  <h1>Google Label Extension 控制面板</h1>
  
  <button onclick="window.GoogleLabelExtension.start()">开始抓取</button>
  <button onclick="window.GoogleLabelExtension.stop()">停止抓取</button>
  <button onclick="window.GoogleLabelExtension.export()">导出数据</button>
  <button onclick="window.GoogleLabelExtension.clear()">清除数据</button>
  
  <div id="status"></div>
  
  <script>
    // 定期更新状态
    setInterval(() => {
      const status = window.GoogleLabelExtension.getStatus();
      document.getElementById('status').innerHTML = `
        <p>正在抓取: ${status.isProcessing}</p>
        <p>当前页码: ${status.currentPage}</p>
        <p>总记录数: ${status.totalRecords}</p>
      `;
    }, 1000);
  </script>
</body>
</html>
```

---

## 消息类型

### GOOGLE_LABEL_START
开始抓取数据

### GOOGLE_LABEL_STOP
停止抓取数据

### GOOGLE_LABEL_EXPORT
导出数据

### GOOGLE_LABEL_CLEAR
清除数据

### GOOGLE_LABEL_STATUS
获取状态

### GOOGLE_LABEL_STATUS_RESPONSE
状态响应

---

## 使用场景

### 场景1：完全自动抓取

```javascript
// 访问目标URL
// 插件自动检测并开始抓取
// 无需手动操作
```

### 场景2：手动控制抓取

```javascript
// 访问目标URL
// 在控制台执行
window.GoogleLabelExtension.start();

// 等待抓取完成
// 查看控制台输出

// 如果需要停止
window.GoogleLabelExtension.stop();

// 导出数据
window.GoogleLabelExtension.export();
```

### 场景3：分步抓取

```javascript
// 访问目标URL
// 在控制台执行
window.GoogleLabelExtension.scrapeCurrentPage();

// 手动翻页
// 再次执行
window.GoogleLabelExtension.scrapeCurrentPage();

// 重复以上步骤
// 最后导出
window.GoogleLabelExtension.export();
```

### 场景4：外部程序调用

```javascript
// 使用fetch调用
fetch('https://www.evergreen-shipping.cn/servlet/TUF1_ControllerServlet.do')
  .then(() => {
    // 页面加载完成后
    setTimeout(() => {
      window.GoogleLabelExtension.start();
    }, 5000);
  });

// 或者使用iframe嵌入
const iframe = document.createElement('iframe');
iframe.src = 'https://www.evergreen-shipping.cn/servlet/TUF1_ControllerServlet.do';
document.body.appendChild(iframe);

iframe.onload = function() {
  iframe.contentWindow.postMessage(
    { type: 'GOOGLE_LABEL_START' },
    '*'
  );
};
```

---

## 调试信息

插件会在浏览器控制台输出详细的调试信息：

```
GoogleLabelExtension.start() called
Starting multi-page scraping...
Scraping page 1...
Found 10 rows on page 1
Page 1 scraped, total records: 10
Using selector for page 1: #eeb1_bookingList > table:nth-child(2) > tbody > tr > td:nth-child(3) > a:nth-child(1)
Clicking next page button...
Scraping page 2...
Found 10 rows on page 2
Page 2 scraped, total records: 20
...
No next page button found, scraping complete
Exporting all data...
Total records: 20
Exporting to CSV...
CSV exported successfully
Exporting to JSON...
JSON exported successfully
```

---

## 注意事项

1. **URL匹配**：插件只在目标URL上自动运行
2. **延迟时间**：页面加载后延迟5秒开始抓取
3. **翻页间隔**：每次翻页间隔5秒
4. **数据存储**：数据保存在内存中，刷新页面会丢失
5. **导出格式**：同时导出CSV和JSON两种格式
6. **状态检查**：可以通过getStatus()实时查看抓取状态

---

## 错误处理

如果遇到错误，控制台会显示：

```
Table not found with selector: #eeb1_bookingList > table.Design1
tbody not found
No rows found in tbody
No data to export
```

请根据错误信息检查：
- 页面是否完全加载
- 选择器是否正确
- 表格结构是否变化
- 是否有足够的权限

---

## 版本信息

- **版本**: 2.0
- **API**: GoogleLabelExtension
- **支持**: Chrome Extension Manifest V3
