<!-- vscode-markdown-toc -->
* 1. [Follow Along Notes](#FollowAlongNotes)
	* 1.1. [Getting Started](#GettingStarted)
	* 1.2. [Working with File Dialogs](#WorkingwithFileDialogs)
		* 1.2.1. [Wiring Up the Open Button](#WiringUptheOpenButton)
		* 1.2.2. [Exercise](#Exercise)
		* 1.2.3. [A Minor Refactoring for macOS](#AMinorRefactoringformacOS)
		* 1.2.4. [Sending the Messages to the Renderer Process](#SendingtheMessagestotheRendererProcess)
	* 1.3. [First Pass at Operating System Integration](#FirstPassatOperatingSystemIntegration)
		* 1.3.1. [Modifying the Window Itself](#ModifyingtheWindowItself)
		* 1.3.2. [Exercise](#Exercise-1)
		* 1.3.3. [A Minor Thing for Mac Users](#AMinorThingforMacUsers)
		* 1.3.4. [Adding to Recent Documents](#AddingtoRecentDocuments)
	* 1.4. [Saving Files](#SavingFiles)
		* 1.4.1. [Exercise: Wire Up "Save HTML" button.](#Exercise:WireUpSaveHTMLbutton.)
		* 1.4.2. [Solution](#Solution)
	* 1.5. [Implementing Drag and Drop](#ImplementingDragandDrop)
	* 1.6. [The Shell Module](#TheShellModule)
	* 1.7. [Building Menus](#BuildingMenus)
		* 1.7.1. [Exercise](#Exercise-1)
	* 1.8. [Last Mile](#LastMile)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc --># Fire Sale

Starter repository for *Introduction to Electron* workshop at QCon 2019.



##  1. <a name='FollowAlongNotes'></a>Follow Along Notes

Below is some of what I'll be live-coding during lecture. This can be useful if you get lost. I'll also be pushing up commits to the `live-coding` branch as we go along—this branch will be a more accurate representation of the work that we're doing.

###  1.1. <a name='GettingStarted'></a>Getting Started

Let's open `index.html`.

```js
const { app, BrowserWindow } = require('electron');

let mainWindow = null;

app.on('ready', () => {
  mainWindow = new BrowserWindow();

  mainWindow.loadFile(`${__dirname}/index.html`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
```

We can refactor this a bit to get rid of that flash of no content:

```js
const { app, BrowserWindow } = require('electron');

let mainWindow = null;

app.on('ready', () => {
  mainWindow = new BrowserWindow({ show: false });

  mainWindow.loadFile(`${__dirname}/index.html`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
```

**Next**: Add the renderer to the `index.html` file.

- Take a tour of the file.
- Show that you can pull open the tools.
- Show off both `require` and `alert`.
- Show that we can programmatically open the developer tools as well.
  - `mainWindow.webContents.openDevTools();`

###  1.2. <a name='WorkingwithFileDialogs'></a>Working with File Dialogs

Let's modify the requires:

```js
const { app, BrowserWindow, dialog } = require('electron');
```

Let's just trigger a an open file dialog:

```js
const getFileFromUser = () => {
  const files = dialog.showOpenDialog({
    properties: ['openFile']
  });

  console.log(files);
};
```

- Notice that we get an array if we select a file.
- Notice that we get `null` in the event that we cancel out.

Let's add a guard clause and read the file:

```js
const getFileFromUser = () => {
  const files = dialog.showOpenDialog({
    properties: ['openFile'],
  });

  if (!files) return;

  const file = files[0];
  const content = fs.readFileSync(file).toString();

  console.log(content);
};
```

There is a problem here though. We can open pretty much any type of file.

Let's add some filters:

```js
const getFileFromUser = () => {
  const files = dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'text'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown'] },
    ],
  });

  if (!files) return;

  const file = files[0];
  const content = fs.readFileSync(file).toString();

  console.log(content);
};
```

We can have some fun with some additional properties:

```js
const getFileFromUser = () => {
  const files = dialog.showOpenDialog({
    title: 'Wowowowowow',
    buttonLabel: 'Hehehehe',
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'text'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown'] },
    ],
  });

  if (!files) return;

  const file = files[0];
  const content = fs.readFileSync(file).toString();

  console.log(content);
};
```

####  1.2.1. <a name='WiringUptheOpenButton'></a>Wiring Up the Open Button

```js
openFileButton.addEventListener('click', () => {
  alert('You clicked the "Open File" button.');
});
```

- Show the difference between the modules available to the main and renderer process.
- Show the `remote` module in the developer tools.

Take the following for a spin in the developer tools:

```js
let mainProcess = require('electron').remote.require('./main.js');
mainProcess.getFileFromUser();
```

####  1.2.2. <a name='Exercise'></a>Exercise

Put it all together.

- In the renderer process, require Electron's `remote` module.
- Require the main process JavaScript file.
- When the user clicks the button. Call `getFileFromUser()`.

##### Solution

```js
const { remote } = require('electron');
const mainProcess = remote.require('./main');

// …

openFileButton.addEventListener('click', () => {
  mainProcess.getFileFromUser();
});
```

####  1.2.3. <a name='AMinorRefactoringformacOS'></a>A Minor Refactoring for macOS

If you pass `mainWindow` as the first argument, then it will slide down from the window, which is nice.

```js
const getFileFromUser = (exports.getFileFromUser = () => {
  const files = dialog.showOpenDialog(mainWindow, { // HERE!
    title: 'Wowowowowow',
    buttonLabel: 'Hehehehe',
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'text'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown'] },
    ],
  });

  if (!files) return;

  const file = files[0];
  const content = fs.readFileSync(file).toString();

  console.log(content);
});
```

####  1.2.4. <a name='SendingtheMessagestotheRendererProcess'></a>Sending the Messages to the Renderer Process

```js
const getFileFromUser = (exports.getFileFromUser = () => {
  const files = dialog.showOpenDialog(mainWindow, {
    title: 'Wowowowowow',
    buttonLabel: 'Hehehehe',
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'text'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown'] },
    ],
  });

  if (!files) return;

  const file = files[0];
  openFile(file); // NEW
});

const openFile = file => { // NEW
  const content = fs.readFileSync(file).toString();
  mainWindow.webContents.send('file-opened', file, content);
};
```

If the main process sends a message, but no one is listening—does it really matter?

**Note**: Flip back to you slides and talk about interprocess communication.

```js
const { remote, ipcRenderer } = require('electron');
```

Now, we can listen for messages from the main process.

```js
ipcRenderer.on('file-opened', (event, file, content) => {
  markdownView.value = content;
  renderMarkdownToHtml(content);
});
```

###  1.3. <a name='FirstPassatOperatingSystemIntegration'></a>First Pass at Operating System Integration

In the renderer process, let's hold on to some information about the file we're working with.

```js
let filePath = null;
let originalContent = '';
```

```js
ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file;
  originalContent = content;

  markdownView.value = content;
  renderMarkdownToHtml(content);
});
```

####  1.3.1. <a name='ModifyingtheWindowItself'></a>Modifying the Window Itself

The `remote` module has a few other tricks up its sleeve.

```js
currentWindow = remote.getCurrentWindow();
currentWindow.setTitle('Hello World');
```

This could be interesting once we open a file, right?

```js
const updateUserInterface = () => {
  let title = 'Fire Sale';

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
  }

  currentWindow.setTitle(title);
};
```

And then we call it when we open file.

```js
ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file;
  originalContent = content;

  markdownView.value = content;
  renderMarkdownToHtml(content);

  updateUserInterface();
});
```

####  1.3.2. <a name='Exercise-1'></a>Exercise

- We're storing the original content in a variable too.
- We also have an event listener being called on every key up.
- We could theoretically check to see if the current content is different from the original content.
- If so, we should display that in the menu bar as well.

##### Solution

```js
markdownView.addEventListener('keyup', (event) => {
  const currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});
```

```js
const updateUserInterface = isEdited => {
  let title = 'Fire Sale';

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
  }

  if (isEdited) {
    title = `${title} (Edited)`;
  }

  currentWindow.setTitle(title);
};
```

If we have some edited content, then we'd probably want to enable those Save and Revert buttons, right?

```js
const updateUserInterface = isEdited => {
  let title = 'Fire Sale';

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
  }

  if (isEdited) {
    title = `${title} (Edited)`;
  }

  currentWindow.setTitle(title);

  saveMarkdownButton.disabled = !isEdited; // NEW
  revertButton.disabled = !isEdited; // NEW
};
```

There we go!

####  1.3.3. <a name='AMinorThingforMacUsers'></a>A Minor Thing for Mac Users

```js
currentWindow.setRepresentedFilename(filePath);
```

####  1.3.4. <a name='AddingtoRecentDocuments'></a>Adding to Recent Documents

In `main.js`:

```js
const openFile = file => {
  const content = fs.readFileSync(file).toString();
  app.addRecentDocument(file); // NEW
  mainWindow.webContents.send('file-opened', file, content);
};
```

###  1.4. <a name='SavingFiles'></a>Saving Files

In `main.js`:

```js
const saveMarkdown = (exports.saveMarkdown = file => {
  if (!file) {
    file = dialog.showSaveDialog(mainWindow, {
      title: 'Save Markdown',
      defaultPath: app.getPath('desktop'),
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }],
    });
  }

  if (!file) return;

  fs.writeFileSync(file, content);
  openFile(file);
});
```

In `renderer.js`:

```js
saveMarkdownButton.addEventListener('click', () => {
  mainProcess.saveMarkdown(filePath, markdownView.value);
});
```

While we're here, let's just write up the Revert button.

```js
revertButton.addEventListener('click', () => {
  markdownView.value = originalContent;
  renderMarkdownToHtml(originalContent);
});
```

####  1.4.1. <a name='Exercise:WireUpSaveHTMLbutton.'></a>Exercise: Wire Up "Save HTML" button.

This is similar to the "Save Markdown" button, but you don't have to worry about whether or not we have a current file. We'll always be exporting a new file.

Hint: You can get the HTML by using `htmlView.innerHTML`.

####  1.4.2. <a name='Solution'></a>Solution

In `main.js`:

```js
const saveHtml = (exports.saveHtml = content => {
  const file = dialog.showSaveDialog(mainWindow, {
    title: 'Save HTML',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
  });

  if (!file) return;

  fs.writeFileSync(file, content);
});
```

In `renderer.js`:

```js
saveHtmlButton.addEventListener('click', () => {
  mainProcess.saveHtml(currentWindow, htmlView.innerHTML);
});
```

###  1.5. <a name='ImplementingDragandDrop'></a>Implementing Drag and Drop

We're going to implement drag and drop in the Markdown view, but before we do that—let's ignore the ability to drag and drop everywhere else.

In `renderer.js`:

```js
document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragleave', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());
```

We'll also set up some helpers:

```js
const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const fileTypeIsSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};
```

Adding visual indicators as to whether or not a file is valid:

```js
markdownView.addEventListener('dragover', (event) => {
  const file = getDraggedFile(event);

  if (fileTypeIsSupported(file)) {
    markdownView.classList.add('drag-over');
  } else {
    markdownView.classList.add('drag-error');
  }
});

markdownView.addEventListener('dragleave', () => {
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});
```

Opening the file if it works out:

```js
markdownView.addEventListener('drop', (event) => {
  const file = getDroppedFile(event);

  if (fileTypeIsSupported(file)) {
    mainProcess.openFile(currentWindow, file.path);
  } else {
    alert('That file type is not supported');
  }

  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});
```

###  1.6. <a name='TheShellModule'></a>The Shell Module

We want to enable those last two buttons in the event that a file is opened.

**Time-Based Exercise**: Have participants do the `showItemInFolder` action. (Do this only if you're still before lunch.)

```js
const updateUserInterface = isEdited => {
  let title = 'Fire Sale';

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
    currentWindow.setRepresentedFilename(filePath);
  }

  if (isEdited) {
    title = `${title} (Edited)`;
  }

  currentWindow.setTitle(title);

  showFileButton.disabled = !filePath; // NEW
  openInDefaultButton.disabled = !filePath; // NEW

  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;
};
```

```js
const showFile = () => {
  if (!filePath) {
    return alert('This file has not been saved to the filesystem.');
  }
  shell.showItemInFolder(filePath);
};

const openInDefaultApplication = () => {
  if (!filePath) {
    return alert('This file has not been saved to the filesystem.');
  }
  shell.openItem(filePath);
};

showFileButton.addEventListener('click', showFile);
openInDefaultButton.addEventListener('click', openInDefaultApplication);
```

###  1.7. <a name='BuildingMenus'></a>Building Menus

Building menus can be tedious. Luckily, Electron has a helper method for us called `Menu.buildFromTemplate`. Let's build a simple menu in `main.js`:

```js
const applicationMenu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        click() {
          console.log('Open File');
        },
      },
    ],
  },
]);
```

Then, when the application is ready:

```js
app.on('ready', () => {
  mainWindow = new BrowserWindow({ show: false });

  Menu.setApplicationMenu(applicationMenu);

  mainWindow.loadFile(`${__dirname}/index.html`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
```

If you're on Windows or Linux, everything should look normal. But, if you're on macOS, things might be a little funky.

We can rectify this:

```js
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        click() {
          console.log('Open File');
        },
      },
    ],
  },
];

if (process.platform === 'darwin') {
  const name = 'Fire Sale';
  template.unshift({
    label: name,
    submenu: [
      {
        label: `About ${name}`,
        role: 'about',
      },
      {
        label: `Quit ${name}`,
        accelerator: 'Command+Q',
        click() {
          app.quit();
        },
      },
    ],
  });
}

const applicationMenu = Menu.buildFromTemplate(template);
```

####  1.7.1. <a name='Exercise-1'></a>Exercise

Can you implement copy, cut, and paste in the Edit menu?

###  1.8. <a name='LastMile'></a>Last Mile

Implement open file.

Implement save and export to HTML.

Have participants implement exporting HTML if time allows.
