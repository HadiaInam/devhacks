const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')

let mainWindow = null
let copilotWindow = null

app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'http://localhost:3000')
app.commandLine.appendSwitch('enable-speech-dispatcher')

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadURL('http://localhost:3000')
}

function createCopilotWindow(questions) {
  if (copilotWindow && !copilotWindow.isDestroyed()) {
    copilotWindow.focus()
    return
  }

  copilotWindow = new BrowserWindow({
    width: 500,
    height: 800,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  copilotWindow.loadURL('http://localhost:3000/copilot')
  copilotWindow.setAlwaysOnTop(true, 'screen-saver')
  copilotWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  copilotWindow.webContents.once('did-finish-load', () => {
    console.log('setting questions:', questions)
    copilotWindow.webContents.executeJavaScript(`
      sessionStorage.setItem('copilotQuestions', ${JSON.stringify(JSON.stringify(questions || []))});
    `)
  })

  copilotWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true)
  })

  copilotWindow.webContents.session.setPermissionCheckHandler(() => true)

  copilotWindow.on('closed', () => { copilotWindow = null })
}

ipcMain.on('open-copilot', (event, questions) => {
  console.log('open-copilot received, questions:', questions)
  createCopilotWindow(questions)
})

ipcMain.on('close-copilot', (event, text) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL('http://localhost:3000/post-consultation-results')
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        sessionStorage.setItem('consultationText', ${JSON.stringify(text || '')});
      `)
    })
    mainWindow.focus()
  }
  BrowserWindow.fromWebContents(event.sender)?.close()
})

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'microphone') {
      callback(true)
    } else {
      callback(false)
    }
  })
  createMainWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})