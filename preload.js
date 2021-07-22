const { ipcRenderer, contextBridge } = require('electron');

// https://qiita.com/pochman/items/62de713a014dcacbad68
contextBridge.exposeInMainWorld(
  'xpubkeyViewApi',
  {
    requestLedgerXpubkey: (value, asset) => {
      ipcRenderer.send('requestLedgerXpubkey', value, asset);
    },
    setupAuthorizationKey: (value) => {
      ipcRenderer.send('setupAuthorizationKey', value);
    },
    requestLedgerInfo: () => {
      ipcRenderer.send('requestLedgerInfo');
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    }
  }
)
