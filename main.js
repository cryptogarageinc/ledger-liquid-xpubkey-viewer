// Modules to control application life and create native browser window
const LedgerLib = require("ledger-liquid-lib-simple");

const { app, BrowserWindow, ipcMain } = require("electron");

const path = require('path');
const url = require('url');

let lastConnectedApp = LedgerLib.ApplicationType.Empty;

// This a very basic example
// Ideally you should not run this code in main thread
// but run it in a dedicated node.js process
function getLedgerInfo() {
  console.log('getLedgerInfo call.');
  const liquidLib = new LedgerLib.LedgerLiquidWrapper('liquidv1');
  return liquidLib.connect(10, '')
    .then(status => {
      if (status.success) {
        return liquidLib.getApplicationInfo().then(result => {
          if (result.success) {
            lastConnectedApp = result.name;
          }
          return result;
        });
      }
      console.log('connect fail. ', status);
      return status;
    })
    .finally(() => {
      return liquidLib.disconnect().then(() => {
        console.log('getLedgerInfo disconnect.')
      });
    });
}

function getXpubkeyInfo(path) {
  console.log(`getXpubkeyInfo call. path:${path}`);
  const netType =
      (lastConnectedApp === LedgerLib.ApplicationType.LiquidHeadless) ?
          LedgerLib.NetworkType.LiquidV1 : LedgerLib.NetworkType.Regtest;
  const liquidLib = new LedgerLib.LedgerLiquidWrapper(netType, true);
  return liquidLib.connect(0, '')
    .then(status => {
      if (status.success) {
        return liquidLib.getXpubKey(path).then(result => {
          return result;
        });
      }
      console.log('connect fail. ', status);
      return status;
    })
    .catch(e => {
      console.warn(e);
    })
    .finally(() => {
      return liquidLib.disconnect().then(() => {
        console.log('getXpubkeyInfo disconnect.')
      });
    });
}

function setAuthorizationKey(key) {
  console.log('setAuthorizationKey call. key:', key);
  const netType =
      (lastConnectedApp === LedgerLib.ApplicationType.LiquidHeadless) ?
          LedgerLib.NetworkType.LiquidV1 : LedgerLib.NetworkType.Regtest;
  const liquidLib = new LedgerLib.LedgerLiquidWrapper(netType, true);
  return liquidLib.connect(0, '')
    .then(status => {
      if (status.success) {
        return liquidLib.setupHeadlessAuthorization(key).then(result => {
          return result;
        });
      }
      console.log('connect fail. ', status);
      return status;
    })
    .catch(e => {
      console.warn(e);
    })
    .finally(() => {
      return liquidLib.disconnect().then(() => {
        console.log('setAuthorizationKey disconnect.')
      });
    });
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
     webPreferences: {
      nodeIntegration: true
    }, width: 600, height: 400 });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // ~~~ BASIC LEDGER EXAMPLE ~~~

  ipcMain.on("requestLedgerInfo", (event) => {
    getLedgerInfo().then(result => {
      console.log('ledgerInfo');
      console.log(result);
      mainWindow.webContents.send("ledgerInfo", result);
    });
  });

  ipcMain.on("requestLedgerXpubkey", (event, path, asset) => {
    getXpubkeyInfo(path).then(result => {
      console.log('ledgerXpubkey');
      console.log(result);
      mainWindow.webContents.send("ledgerXpubkey", result, asset);
    });
  });

  ipcMain.on("setupAuthorizationKey", (event, arg) => {
    setAuthorizationKey(arg).then(result => {
      console.log('setupAuthorizationKeyResponse');
      console.log(result);
      mainWindow.webContents.send("setupAuthorizationKeyResponse", result);
    });
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
