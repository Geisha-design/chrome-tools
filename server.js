const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let extensionWs = null;

wss.on('connection', (ws) => {
  console.log('WebSocket客户端已连接');
  extensionWs = ws;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到消息:', data);
    } catch (error) {
      console.error('解析消息失败:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket客户端已断开');
    extensionWs = null;
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Google Label HTTP API',
    version: '1.0.0',
    status: extensionWs ? 'connected' : 'disconnected',
    endpoints: {
      start: 'POST /api/start',
      stop: 'POST /api/stop',
      export: 'POST /api/export',
      clear: 'POST /api/clear',
      status: 'GET /api/status',
      scrapeCurrentPage: 'POST /api/scrape-current-page'
    }
  });
});

app.post('/api/start', async (req, res) => {
  try {
    if (!extensionWs) {
      return res.status(503).json({
        success: false,
        error: '扩展未连接'
      });
    }

    const message = { type: 'START' };
    extensionWs.send(JSON.stringify(message));

    res.json({
      success: true,
      message: '开始抓取指令已发送'
    });
  } catch (error) {
    console.error('启动抓取失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/stop', async (req, res) => {
  try {
    if (!extensionWs) {
      return res.status(503).json({
        success: false,
        error: '扩展未连接'
      });
    }

    const message = { type: 'STOP' };
    extensionWs.send(JSON.stringify(message));

    res.json({
      success: true,
      message: '停止抓取指令已发送'
    });
  } catch (error) {
    console.error('停止抓取失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    if (!extensionWs) {
      return res.status(503).json({
        success: false,
        error: '扩展未连接'
      });
    }

    const message = { type: 'EXPORT' };
    extensionWs.send(JSON.stringify(message));

    res.json({
      success: true,
      message: '导出指令已发送'
    });
  } catch (error) {
    console.error('导出数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/clear', async (req, res) => {
  try {
    if (!extensionWs) {
      return res.status(503).json({
        success: false,
        error: '扩展未连接'
      });
    }

    const message = { type: 'CLEAR' };
    extensionWs.send(JSON.stringify(message));

    res.json({
      success: true,
      message: '清除数据指令已发送'
    });
  } catch (error) {
    console.error('清除数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    if (!extensionWs) {
      return res.status(503).json({
        success: false,
        error: '扩展未连接'
      });
    }

    const message = { type: 'STATUS' };
    extensionWs.send(JSON.stringify(message));

    res.json({
      success: true,
      message: '状态查询指令已发送，请监听WebSocket消息获取状态'
    });
  } catch (error) {
    console.error('获取状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/scrape-current-page', async (req, res) => {
  try {
    if (!extensionWs) {
      return res.status(503).json({
        success: false,
        error: '扩展未连接'
      });
    }

    const message = { type: 'SCRAPE_CURRENT_PAGE' };
    extensionWs.send(JSON.stringify(message));

    res.json({
      success: true,
      message: '抓取当前页指令已发送'
    });
  } catch (error) {
    console.error('抓取当前页失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`HTTP服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket服务器运行在 ws://localhost:${PORT}`);
  console.log('等待浏览器扩展连接...');
});
