#!/usr/bin/env electron

import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from './src/config.js';
import { startWebServer } from './src/web-server.js';  // 수정된 함수

const __dirname = dirname(fileURLToPath(import.meta.url));

// Keep a global reference of the window object
let mainWindow;
let webServer;

function createWindow() {
  // 프로젝트 루트 (현재 디렉토리)
  const projectRoot = join(__dirname, '.');
  if (process.cwd() !== projectRoot) process.chdir(projectRoot);

  const config = getConfig();

  // 웹 서버 시작 (수정된 startWebServer 사용)
  webServer = startWebServer(config);

  // 서버 준비 대기
  const port = 3000;
  const readyPromise = new Promise((resolve) => {
    const server = webServer._server || webServer.server; // express listen server
    if (server.listening) resolve();
    else server.on('listening', resolve);
  });

  readyPromise.then(() => {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 900,
      minHeight: 700,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      backgroundColor: '#111827',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: true
      },
      show: false // 준비 후 show
    });

    mainWindow.loadURL(`http://localhost:${port}/chat`);

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      if (process.env.ULTIMATE_DEV) mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }).catch(console.error);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (webServer) {
    webServer.close(() => {
      console.log('웹 서버 종료');
    });
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Graceful shutdown
process.on('SIGINT', () => app.quit());
