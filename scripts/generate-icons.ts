import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgPath = path.resolve('public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { file: 'public/pwa-192x192.png', size: 192 },
    { file: 'public/pwa-512x512.png', size: 512 },
    { file: 'public/pwa-maskable-512x512.png', size: 512 },
    { file: 'public/apple-touch-icon.png', size: 180 },
    { file: 'public/favicon.png', size: 64 },
  ];

  for (const target of targets) {
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png()
      .toFile(path.resolve(target.file));
    console.log(`Generated ${target.file} (${target.size}x${target.size})`);
  }
}

generateIcons().catch(console.error);
