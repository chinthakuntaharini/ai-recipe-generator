const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');
const chunksDir = path.join(outDir, '_next', 'static', 'chunks');
const cssDir = path.join(outDir, '_next', 'static', 'css');

// Find actual chunk filenames
function findChunk(pattern) {
  try {
    const files = fs.readdirSync(chunksDir);
    const match = files.find(f => f.match(pattern));
    return match ? `/_next/static/chunks/${match}` : null;
  } catch (e) {
    console.error(`Error finding chunk ${pattern}:`, e.message);
    return null;
  }
}

function findCSS() {
  try {
    const files = fs.readdirSync(cssDir);
    const cssFile = files.find(f => f.endsWith('.css'));
    return cssFile ? `/_next/static/css/${cssFile}` : null;
  } catch (e) {
    console.error('Error finding CSS:', e.message);
    return null;
  }
}

// Get actual chunk files
const polyfills = findChunk(/^polyfills-.*\.js$/);
const webpack = findChunk(/^webpack-.*\.js$/);
const framework = findChunk(/^framework-.*\.js$/);
const main = findChunk(/^main-[a-f0-9]+\.js$/);
const mainApp = findChunk(/^main-app-.*\.js$/);
const cssFile = findCSS();

console.log('Found chunks:', { polyfills, webpack, framework, main, mainApp, cssFile });

// Read the RSC payload files
const pages = ['index', 'profile', 'history'];

const htmlTemplate = (pageName) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Recipe Generator</title>
  <meta name="description" content="Generate personalized recipes with AI">
  ${cssFile ? `<link rel="stylesheet" href="${cssFile}">` : ''}
</head>
<body class="custom-cursor-area">
  <div id="__next"></div>
  <script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{}},"page":"/${pageName === 'index' ? '' : pageName}","query":{},"buildId":"production","isFallback":false,"gssp":false,"appGip":true}</script>
  ${polyfills ? `<script src="${polyfills}" nomodule=""></script>` : ''}
  ${webpack ? `<script src="${webpack}" async=""></script>` : ''}
  ${framework ? `<script src="${framework}" async=""></script>` : ''}
  ${main ? `<script src="${main}" async=""></script>` : ''}
  ${mainApp ? `<script src="${mainApp}" async=""></script>` : ''}
</body>
</html>`;

pages.forEach(pageName => {
  const txtFile = path.join(outDir, `${pageName}.txt`);
  const htmlFile = path.join(outDir, `${pageName}.html`);
  
  if (fs.existsSync(txtFile)) {
    const html = htmlTemplate(pageName);
    fs.writeFileSync(htmlFile, html);
    console.log(`Generated ${pageName}.html`);
  }
});

// Also generate for subdirectories
['profile', 'history'].forEach(pageName => {
  const subDir = path.join(outDir, pageName);
  const txtFile = path.join(subDir, 'index.txt');
  const htmlFile = path.join(subDir, 'index.html');
  
  if (fs.existsSync(txtFile)) {
    const html = htmlTemplate(pageName);
    fs.writeFileSync(htmlFile, html);
    console.log(`Generated ${pageName}/index.html`);
  }
});

console.log('HTML generation complete!');
