const { ipcRenderer } = require('electron');

document.getElementById('main').innerHTML =
  "<h1>Connect your Ledger <br> and open Liquid Headless app...</h1>";

ipcRenderer.on("ledgerInfo", (event, arg) => {
  const h2 = document.createElement("h2");
  const strarr = [];
  if (arg.xpubKey.length > 80) {
    strarr.push(arg.xpubKey.substring(0, 40));
    strarr.push(arg.xpubKey.substring(40, 80));
    strarr.push(arg.xpubKey.substring(80, arg.xpubKey.length));
    h2.textContent = strarr.join('\n');
  } else {
    h2.textContent = arg.xpubKey;
  }
  h2.style.textAlign = 'center';
  document.getElementById('main').innerHTML =
    "<h1>xpub: </h1>\n";
  document.getElementById('main').appendChild(h2);
});

ipcRenderer.send('requestLedgerInfo', '44\'/0\'/0\'');
