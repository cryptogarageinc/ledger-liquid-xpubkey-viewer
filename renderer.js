const { ipcRenderer } = require('electron');

const testingAuthPubkey = '04b85b0e5f5b41f1a95bbf9a83edd95c741223c6d9dc5fe607de18f015684ff56ec359705fcf9bbeb1620fb458e15e3d99f23c6f5df5e91e016686371a65b16f0c';
const productAuthPubkey = '04fb353afec6e71290869e7146eb18be90c25a1d90d85ab6dc9870d29d41da2dfacc553e008621c3e78f6dc78fe1b3f5c0c200f67c8dc2f3536f1ea63de485dd88';
const appNameTitle = 'ConnectApp';

function changeDisable(disabled, connectDisabled = undefined) {
  const fieldNames = [
    'lbtcXpubkey',
    'jpysXpubkey',
    'requestLbtcXpubkey',
    'requestJpysXpubkey',
    'lbtcBip32path',
    'jpysBip32path',
    'authPubkey',
    'requestAuthkey',
    'authkeyResult',
    'connect',
  ];
  for (const name of fieldNames) {
    const field = document.getElementById(name);
    if (name === 'connect') {
      if (typeof connectDisabled === 'boolean') {
        field.disabled = connectDisabled;
      } else {
        field.disabled = disabled;
      }
    } else {
      field.disabled = disabled;
    }
  }
}

function checkDisconnect(arg) {
  if (('disconnect' in arg) && (arg.disconnect ===  true)) {
    document.getElementById('authPubkey').value = testingAuthPubkey;
    changeDisable(true, false);
    document.getElementById('app-name').innerHTML = `${appNameTitle}: -`;
    document.getElementById('connectResponse').value = arg.errorMessage;
    document.getElementById('connect').disabled = false;
  } else {
    changeDisable(false, true);
  }
}

function getXpubkey(asset){
  const bip32path = document.getElementById(asset + 'Bip32path');
  const xpubkeyField = document.getElementById(asset + 'Xpubkey');
  if (bip32path.value.length === 0) {
    return;
  }
  const pathArr = bip32path.value.split('/');
  let num = 0;
  for (const path of pathArr) {
    if (!path) {
      xpubkeyField.value = 'invalid bip32 path.';
      return;
    }
    let checkLen = path.length;
    if (path === 'm' || path === 'M') {
      continue;
    } else if (path.charAt(path.length - 1) === '\'' ||
        path.charAt(path.length - 1) === 'h' ||
        path.charAt(path.length - 1) === 'H') {
      // hardened
      checkLen = path.length - 1;
    }
    const checkPath = path.substring(0, checkLen);
    if (isNaN(checkPath)) {
      xpubkeyField.value = 'invalid bip32 path.';
      return;
    }
    ++num;
  }
  if (num === 0) {
    xpubkeyField.value = 'invalid bip32 path.';
    return;
  }
  changeDisable(true);
  ipcRenderer.send('requestLedgerXpubkey', bip32path.value, asset);
}

function setAuthKey(){
  const authPubkey = document.getElementById('authPubkey');
  const authkeyField = document.getElementById("authkeyResult");
  if (authPubkey.value.length !== 130) {
    authkeyField.value = 'invalid authorization pubkey. pubkey is uncompress only.';
    return;
  }
  if (!/^[0-9a-f]{130}$/i.test(authPubkey.value)) {
    authkeyField.value = 'invalid authorization pubkey. character is hex only.';
    return;
  }
  changeDisable(true);
  ipcRenderer.send('setupAuthorizationKey', authPubkey.value);
}

ipcRenderer.on("ledgerInfo", (event, arg) => {
  if (arg.success) {
    const ver = `v${arg.version.major}.${arg.version.minor}.${arg.version.patch}`
    document.getElementById('app-name').innerHTML = `${appNameTitle}: ${arg.name} (${ver})`;
    document.getElementById('connectResponse').value = 'connect';
    if (arg.name === 'Liquid Hless') {
      document.getElementById('authPubkey').value = productAuthPubkey;
    } else {
      document.getElementById('authPubkey').value = testingAuthPubkey;
    }
    changeDisable(false, true);
  } else {
    changeDisable(true, false);
    document.getElementById('app-name').innerHTML = 'name: -';
    document.getElementById('connectResponse').value = arg.errorMessage;
    document.getElementById('connect').disabled = false;
  }
});

ipcRenderer.on("ledgerXpubkey", (event, arg, asset) => {
  const xpubkeyField = document.getElementById(asset + "Xpubkey");
  if (arg.success) {
    xpubkeyField.value = arg.xpubKey;
    changeDisable(false, true);
  } else {
    xpubkeyField.value = arg.errorMessage;
    checkDisconnect(arg);
  }
});

ipcRenderer.on("setupAuthorizationKeyResponse", (event, arg) => {
  const authkeyField = document.getElementById("authkeyResult");
  if (arg.success) {
    authkeyField.value = 'success';
    changeDisable(false, true);
  } else if (arg.errorMessage === 'CONDITIONS_OF_USE_NOT_SATISFIED') {
    authkeyField.value = 'success (already registed)';
    changeDisable(false, true);
  } else {
    authkeyField.value = arg.errorMessage;
    checkDisconnect(arg);
  }
});

document.getElementById('connect').addEventListener('click', () => {
  changeDisable(true);
  document.getElementById('connectResponse').value = 'check connection...';
  ipcRenderer.send('requestLedgerInfo');
});

document.getElementById('requestLbtcXpubkey').addEventListener('click', () => {
  getXpubkey('lbtc');
});
document.getElementById('requestJpysXpubkey').addEventListener('click', () => {
  getXpubkey('jpys');
});

document.getElementById('requestAuthkey').addEventListener('click', () => {
  setAuthKey();
});

// first execute
document.getElementById('authPubkey').value = testingAuthPubkey;
document.getElementById('connect').disabled = true;
changeDisable(true);
document.getElementById('connectResponse').value = 'check connection...';
ipcRenderer.send('requestLedgerInfo');
