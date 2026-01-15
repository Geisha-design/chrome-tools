# Google Label HTTP API 文档

## 概述

Google Label扩展现在支持通过HTTP接口进行远程调用，使用WebSocket进行实时通信。这使得你可以从任何应用程序或脚本中控制扩展的抓取功能。

## 架构说明

```
HTTP客户端 -> HTTP服务器 (localhost:3000) -> WebSocket -> 浏览器扩展
```

- **HTTP服务器**: 提供RESTful API接口，接收HTTP请求
- **WebSocket**: 实现服务器与浏览器扩展之间的实时双向通信
- **浏览器扩展**: 执行实际的网页抓取操作

## 快速开始

### 1. 安装依赖

```bash
cd /Users/qiyuzheng/Documents/trae_projects/google_label
npm install
```

### 2. 启动HTTP服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 3. 加载浏览器扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `/Users/qiyuzheng/Documents/trae_projects/google_label` 目录

### 4. 访问目标网页

访问目标URL: `https://www.evergreen-shipping.cn/servlet/TUF1_ControllerServlet.do`

扩展会自动连接到WebSocket服务器。

## API接口

### 基础信息

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **响应格式**: JSON

### 1. 开始抓取

**接口**: `POST /api/start`

**描述**: 开始自动抓取所有页面数据，自动翻页直到最后一页，完成后自动导出。

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/start \
  -H "Content-Type: application/json"
```

**响应示例**:

```json
{
  "success": true,
  "message": "开始抓取指令已发送"
}
```

**错误响应**:

```json
{
  "success": false,
  "error": "扩展未连接"
}
```

### 2. 停止抓取

**接口**: `POST /api/stop`

**描述**: 立即停止当前的抓取过程，保留已抓取的数据。

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/stop \
  -H "Content-Type: application/json"
```

**响应示例**:

```json
{
  "success": true,
  "message": "停止抓取指令已发送"
}
```

### 3. 导出数据

**接口**: `POST /api/export`

**描述**: 导出当前已抓取的数据为CSV和JSON格式。

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json"
```

**响应示例**:

```json
{
  "success": true,
  "message": "导出指令已发送"
}
```

### 4. 清除数据

**接口**: `POST /api/clear`

**描述**: 清除所有已抓取的数据，重置状态。

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/clear \
  -H "Content-Type: application/json"
```

**响应示例**:

```json
{
  "success": true,
  "message": "清除数据指令已发送"
}
```

### 5. 获取状态

**接口**: `GET /api/status`

**描述**: 查询当前抓取状态。

**请求示例**:

```bash
curl http://localhost:3000/api/status
```

**响应示例**:

```json
{
  "success": true,
  "message": "状态查询指令已发送，请监听WebSocket消息获取状态"
}
```

**注意**: 实际状态通过WebSocket消息返回，详见"WebSocket消息"部分。

### 6. 抓取当前页

**接口**: `POST /api/scrape-current-page`

**描述**: 只抓取当前页面，不进行翻页。

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/scrape-current-page \
  -H "Content-Type: application/json"
```

**响应示例**:

```json
{
  "success": true,
  "message": "抓取当前页指令已发送"
}
```

## WebSocket消息

### 连接

扩展会自动连接到 `ws://localhost:3000`，如果连接断开会自动重连。

### 消息类型

#### 1. STATUS_UPDATE (状态更新)

扩展主动发送的状态更新消息。

```json
{
  "type": "STATUS_UPDATE",
  "data": {
    "isProcessing": true,
    "currentPage": 3,
    "totalRecords": 45,
    "shouldStop": false,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. PROGRESS (进度更新)

扩展发送的进度更新消息。

```json
{
  "type": "PROGRESS",
  "data": {
    "message": "正在抓取第 3 页...",
    "isProcessing": true,
    "currentPage": 3,
    "totalRecords": 30,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 使用示例

### Python示例

```python
import requests
import time
import json

BASE_URL = "http://localhost:3000"

def start_scraping():
    response = requests.post(f"{BASE_URL}/api/start")
    print(response.json())

def stop_scraping():
    response = requests.post(f"{BASE_URL}/api/stop")
    print(response.json())

def export_data():
    response = requests.post(f"{BASE_URL}/api/export")
    print(response.json())

def clear_data():
    response = requests.post(f"{BASE_URL}/api/clear")
    print(response.json())

def get_status():
    response = requests.get(f"{BASE_URL}/api/status")
    print(response.json())

def scrape_current_page():
    response = requests.post(f"{BASE_URL}/api/scrape-current-page")
    print(response.json())

# 使用示例
if __name__ == "__main__":
    # 开始抓取
    start_scraping()
    
    # 等待抓取完成
    time.sleep(60)
    
    # 导出数据
    export_data()
```

### JavaScript示例

```javascript
const BASE_URL = 'http://localhost:3000';

async function startScraping() {
  const response = await fetch(`${BASE_URL}/api/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data);
}

async function stopScraping() {
  const response = await fetch(`${BASE_URL}/api/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data);
}

async function exportData() {
  const response = await fetch(`${BASE_URL}/api/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data);
}

async function clearData() {
  const response = await fetch(`${BASE_URL}/api/clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data);
}

async function getStatus() {
  const response = await fetch(`${BASE_URL}/api/status`);
  const data = await response.json();
  console.log(data);
}

async function scrapeCurrentPage() {
  const response = await fetch(`${BASE_URL}/api/scrape-current-page`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data);
}

// 使用示例
async function main() {
  await startScraping();
  
  // 等待抓取完成
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  await exportData();
}

main();
```

### Node.js示例

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function startScraping() {
  try {
    const response = await axios.post(`${BASE_URL}/api/start`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

async function stopScraping() {
  try {
    const response = await axios.post(`${BASE_URL}/api/stop`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

async function exportData() {
  try {
    const response = await axios.post(`${BASE_URL}/api/export`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

async function clearData() {
  try {
    const response = await axios.post(`${BASE_URL}/api/clear`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

async function getStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/api/status`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

async function scrapeCurrentPage() {
  try {
    const response = await axios.post(`${BASE_URL}/api/scrape-current-page`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

// 使用示例
async function main() {
  await startScraping();
  
  // 等待抓取完成
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  await exportData();
}

main();
```

### Java示例

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

public class GoogleLabelClient {
    private static final String BASE_URL = "http://localhost:3000";

    public static void startScraping() throws Exception {
        sendPostRequest("/api/start", null);
    }

    public static void stopScraping() throws Exception {
        sendPostRequest("/api/stop", null);
    }

    public static void exportData() throws Exception {
        sendPostRequest("/api/export", null);
    }

    public static void clearData() throws Exception {
        sendPostRequest("/api/clear", null);
    }

    public static void getStatus() throws Exception {
        sendGetRequest("/api/status");
    }

    public static void scrapeCurrentPage() throws Exception {
        sendPostRequest("/api/scrape-current-page", null);
    }

    private static void sendPostRequest(String endpoint, String jsonBody) throws Exception {
        URL url = new URL(BASE_URL + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        if (jsonBody != null) {
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonBody.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
        }

        int responseCode = conn.getResponseCode();
        BufferedReader br = new BufferedReader(
            new InputStreamReader(conn.getInputStream(), "utf-8"));
        StringBuilder response = new StringBuilder();
        String responseLine;
        while ((responseLine = br.readLine()) != null) {
            response.append(responseLine.trim());
        }
        System.out.println(new JSONObject(response.toString()).toString(2));
    }

    private static void sendGetRequest(String endpoint) throws Exception {
        URL url = new URL(BASE_URL + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");

        int responseCode = conn.getResponseCode();
        BufferedReader br = new BufferedReader(
            new InputStreamReader(conn.getInputStream(), "utf-8"));
        StringBuilder response = new StringBuilder();
        String responseLine;
        while ((responseLine = br.readLine()) != null) {
            response.append(responseLine.trim());
        }
        System.out.println(new JSONObject(response.toString()).toString(2));
    }

    public static void main(String[] args) throws Exception {
        startScraping();
        
        // 等待抓取完成
        Thread.sleep(60000);
        
        exportData();
    }
}
```

## 常见使用场景

### 场景1: 定时抓取

```bash
# 每天凌晨2点执行抓取
0 2 * * * curl -X POST http://localhost:3000/api/start
```

### 场景2: 手动控制

```bash
# 开始抓取
curl -X POST http://localhost:3000/api/start

# 查看进度（通过WebSocket监听）

# 停止抓取
curl -X POST http://localhost:3000/api/stop

# 导出数据
curl -X POST http://localhost:3000/api/export
```

### 场景3: 分页抓取

```bash
# 抓取第一页
curl -X POST http://localhost:3000/api/scrape-current-page

# 手动翻页后，抓取第二页
curl -X POST http://localhost:3000/api/scrape-current-page

# 最后导出
curl -X POST http://localhost:3000/api/export
```

## 错误处理

### 1. 扩展未连接

```json
{
  "success": false,
  "error": "扩展未连接"
}
```

**解决方案**: 确保浏览器扩展已加载并访问了目标网页。

### 2. 服务器未启动

```bash
curl: (7) Failed to connect to localhost port 3000
```

**解决方案**: 启动HTTP服务器 `npm start`。

### 3. WebSocket连接失败

**解决方案**: 
- 检查服务器是否正常运行
- 检查防火墙设置
- 确认端口3000未被占用

## 调试

### 查看服务器日志

服务器会输出详细的日志信息：

```
HTTP服务器运行在 http://localhost:3000
WebSocket服务器运行在 ws://localhost:3000
等待浏览器扩展连接...
WebSocket客户端已连接
收到消息: { type: 'START' }
```

### 查看浏览器控制台

按F12打开浏览器控制台，查看扩展的日志输出：

```
WebSocket已连接到服务器
收到START指令
开始多页抓取...
正在抓取第 1 页...
```

## 性能优化

1. **批量操作**: 使用自动抓取而不是手动分页抓取
2. **合理等待**: 给予足够的时间让页面加载和抓取完成
3. **错误重试**: 实现自动重试机制处理网络问题

## 安全建议

1. **本地使用**: 当前设计仅适用于本地使用
2. **访问控制**: 如需远程访问，添加认证机制
3. **数据加密**: 使用HTTPS和WSS加密通信
4. **速率限制**: 添加API调用频率限制

## 故障排除

### 问题1: 扩展无法连接到服务器

**检查**:
- 服务器是否正在运行
- 端口3000是否被占用
- 浏览器是否允许WebSocket连接

### 问题2: 抓取失败

**检查**:
- 目标网页是否正确加载
- 表格选择器是否正确
- 网络连接是否稳定

### 问题3: 数据导出失败

**检查**:
- 是否有数据可导出
- 浏览器下载权限是否正常
- 磁盘空间是否充足

## 版本历史

- **v1.0.0** (2024-01-15)
  - 初始版本
  - 支持HTTP API接口
  - WebSocket实时通信
  - 所有基本功能

## 联系支持

如有问题或建议，请联系开发团队。
