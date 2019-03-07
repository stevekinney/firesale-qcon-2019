const fs = require('fs');
const { app, BrowserWindow, dialog, Menu } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({ show: false });

  Menu.setApplicationMenu(applicationMenu);

  mainWindow.loadFile(`${__dirname}/index.html`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', () => {
    mainWindow = null;
  });
});

const getFileFromUser = exports.getFileFromUser = () => {
  const files = dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown']},
      { name: 'Text Files', extensions: ['txt', 'text']},
    ],
    title: 'Open a Very Cool File',
    buttonLabel: 'Open 🇬🇧'
  });

  if (!files) return;

  const file = files[0];
  openFile(file);
};

const openFile = exports.openFile =  (file) => {
  const content = fs.readFileSync(file).toString();
  app.addRecentDocument(file);
  mainWindow.webContents.send('file-opened', file, content);
};

const saveMarkdown = exports.saveMarkdown = (file, content) => {
  if (!file) {
    file = dialog.showSaveDialog(mainWindow, {
      title: 'Save Markdown',
      filters: [{ name: 'Markdown Files', extensions: ['markdown', 'mdown', 'md'] }],
      defaultPath: app.getPath('documents'),
    });
  }

  if (!file) return;

  fs.writeFileSync(file, content);
  openFile(file);
};

const saveHtml = exports.saveHtml = (content) => {
  const file = dialog.showSaveDialog(mainWindow, {
    title: 'Save HTML',
    defaultPath: app.getPath('exe'),
    filters: [{ name: 'HTML Files', extensions: ['html'] }],
  });

  if (!file) return;

  fs.writeFileSync(file, content);
};

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      { label: 'Open…', click() { showOpenDialog(); } }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Paste', accelerator: 'CommandOrControl+V', role: 'paste' }
    ]
  }
];

if (process.platform === 'darwin') {
  const name = 'Fire Sale';
  menuTemplate.unshift({
    label: name,
    submenu: [
      {
        label: `About ${name}`,
      },
      {
        label: `Quit ${name}`,
        accelerator: 'Command+Q',
        click() {
          app.quit();
        }
      }
    ]
  });
}

const applicationMenu = Menu.buildFromTemplate(menuTemplate);
