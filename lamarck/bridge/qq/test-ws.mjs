/**
 * 测试 NapCatQQ WebSocket 连接
 * 运行: node test-ws.mjs
 */

import WebSocket from 'ws';

const WS_URL = 'ws://172.30.144.1:3001';

console.log(`Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✓ WebSocket connected!');
  console.log('Waiting for messages... (send a QQ message to test)');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('\n--- Received message ---');
    console.log(JSON.stringify(msg, null, 2));
  } catch (e) {
    console.log('Raw message:', data.toString());
  }
});

ws.on('error', (err) => {
  console.error('✗ WebSocket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`WebSocket closed: ${code} ${reason}`);
});

// 30秒后自动退出
setTimeout(() => {
  console.log('\nTest timeout, closing...');
  ws.close();
  process.exit(0);
}, 30000);
