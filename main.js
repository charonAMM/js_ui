const {app, BrowserWindow} = require('electron') 
require('@electron/remote/main').initialize()
const url = require('url') 
const path = require('path')  

let win  

function createWindow() { 
   win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        contentSecurityPolicy: "default-src 'self';"
      }})
   require("@electron/remote/main").enable(win.webContents) 
   win.loadURL(url.format ({ 
      pathname: path.join(__dirname, 'pages/index.html'), 
      protocol: 'file:', 
      slashes: true 
   }))

}

app.on('ready', createWindow) 