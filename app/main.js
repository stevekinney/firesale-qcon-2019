const fs = require('fs');
const { app, BrowserWindow, dialog } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({ show: false });

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

const openFile = (file) => {
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
