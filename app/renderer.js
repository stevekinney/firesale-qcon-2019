const path = require('path');
const { remote, ipcRenderer, shell } = require('electron');
const mainProcess = remote.require('./main');

const marked = require('marked');

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

let filePath = null;
let originalContent = '';

const currentWindow = remote.getCurrentWindow();

const renderMarkdownToHtml = markdown => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = (isEdited = false) => {
  let title = 'Fire Sale';

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
    currentWindow.setRepresentedFilename(filePath);
  }

  if (isEdited) {
    title = `${title} (Edited)`;
  }

  currentWindow.setTitle(title);

  currentWindow.setDocumentEdited(isEdited);

  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;

  showFileButton.disabled = !filePath;
  openInDefaultButton.disabled = !filePath;
};

markdownView.addEventListener('keyup', event => {
  const currentContent = event.target.value;
  const isEdited = currentContent !== originalContent;
  console.log({ isEdited, originalContent, currentContent });
  renderMarkdownToHtml(currentContent);
  updateUserInterface(isEdited);
});

openFileButton.addEventListener('click', () => {
  mainProcess.getFileFromUser();
});

saveMarkdownButton.addEventListener('click', () => {
  mainProcess.saveMarkdown(filePath, markdownView.value);
});

saveHtmlButton.addEventListener('click', () => {
  mainProcess.saveHtml(htmlView.innerHTML);
});

ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file;
  originalContent = content;

  markdownView.value = content;
  renderMarkdownToHtml(content);

  updateUserInterface();
});

document.addEventListener('dragover', (event) => { event.preventDefault(); });

const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const fileTypeIsSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};

markdownView.addEventListener('dragover', (event) => {
  const file = getDraggedFile(event);

  if (fileTypeIsSupported(file)) {
    markdownView.classList.add('drag-over');
  } else {
    markdownView.classList.add('drag-error');
  }
});

markdownView.addEventListener('drop', (event) => {
  const file = getDroppedFile(event);

  if (fileTypeIsSupported(file)) {
    mainProcess.openFile(file.path);
  } else {
    alert('This file type is not supported!');
  }

  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});

markdownView.addEventListener('dragleave', () => {
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});

const showFile = () => {
  if (!filePath) return;
  shell.showItemInFolder(filePath);
};

const openInDefaultApplication = () => {
  if (!filePath) return;
  shell.openItem(filePath);
};

showFileButton.addEventListener('click', showFile);
openInDefaultButton.addEventListener('click', openInDefaultApplication);
