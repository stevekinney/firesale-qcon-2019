const path = require('path');
const { remote, ipcRenderer } = require('electron');
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

ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file;
  originalContent = content;

  markdownView.value = content;
  renderMarkdownToHtml(content);

  updateUserInterface();
});
