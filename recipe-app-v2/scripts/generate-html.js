const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

// Read the RSC payload files
const pages = ['index', 'profile', 'history'];

const htmlTemplate = (pageName, rscContent) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Recipe Generator</title>
  <meta name="description" content="Generate personalized recipes with AI">
  <link rel="stylesheet" href="/_next/static/css/c2748a8c93dea861.css">
</head>
<body class="custom-cursor-area">
  <div id="__next"></div>
  <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: {} }, page: `/${pageName === 'index' ? '' : pageName}`, query: {}, buildId: 'development', isFallback: false, gssp: false, appGip: true })}</script>
  <script src="/_next/static/chunks/polyfills-42372ed130431b0a.js" nomodule=""></script>
  <script src="/_next/static/chunks/webpack-c105cf7135d99ba2.js" async=""></script>
  <script src="/_next/static/chunks/framework-f66176bb897dc684.js" async=""></script>
  <script src="/_next/static/chunks/main-a458838a97bdf9bf.js" async=""></script>
  <script src="/_next/static/chunks/pages/_app-72b849fbd24ac258.js" async=""></script>
  <script src="/_next/static/chunks/main-app-6360976916f6eb7d.js" async=""></script>
</body>
</html>`;

pages.forEach(pageName => {
  const txtFile = path.join(outDir, `${pageName}.txt`);
  const htmlFile = path.join(outDir, `${pageName}.html`);
  
  if (fs.existsSync(txtFile)) {
    const rscContent = fs.readFileSync(txtFile, 'utf-8');
    const html = htmlTemplate(pageName, rscContent);
    fs.writeFileSync(htmlFile, html);
    console.log(`Generated ${pageName}.html`);
  }
});

console.log('HTML generation complete!');
