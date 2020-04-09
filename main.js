// Modules to control application life and create native browser window
require("babel-polyfill");
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const LedgerLib = require("ledger-liquid-lib");

const { app, BrowserWindow, ipcMain } = require("electron");

const liquidLib = new LedgerLib.LedgerLiquidWrapper('liquidv1');

// This a very basic example
// Ideally you should not run this code in main thread
// but run it in a dedicated node.js process
function getLedgerInfo(path) {
  console.log('getLedgerInfo call. path:', path);
  return liquidLib.connect(1, '')
    .then(status => {
      if (status.success) {
        return liquidLib.getXpubKey(path).then(result => {
            if (result.success) {
              return result;
            }
            console.log('getXpubKey fail. ', result);
            return new Promise(s => setTimeout(s, 100)).then(() =>
              getLedgerInfo(path)
            );
          }
        );
      }
      console.log('connect fail. ', status);
      return new Promise(s => setTimeout(s, 100)).then(() =>
        getLedgerInfo(path)
      );
    })
    .catch(e => {
      console.warn(e);
      // try again until success!
      return new Promise(s => setTimeout(s, 100)).then(() =>
        getLedgerInfo(path)
      );
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
  mainWindow.loadFile("index.html");

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

  ipcMain.on("requestLedgerInfo", (event, arg) => {
    getLedgerInfo(arg).then(result => {
      mainWindow.webContents.send("ledgerInfo", result);
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
