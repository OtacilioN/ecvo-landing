const bodyFontsUrl = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";

export function renderFontHead(assetPrefix = "../") {
  const escapedFontsUrl = bodyFontsUrl.replaceAll("&", "&amp;");

  return `    <link rel="preload" href="${assetPrefix}assets/archivo-black-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" as="style" href="${escapedFontsUrl}" onload="this.onload=null;this.rel='stylesheet'" />
    <noscript><link rel="stylesheet" href="${escapedFontsUrl}" /></noscript>`;
}
