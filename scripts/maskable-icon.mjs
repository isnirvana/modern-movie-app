// Renders the full-bleed maskable icon (the assets generator would pad the rounded logo instead)
import sharp from 'sharp';

await sharp('public/logo-maskable.svg', { density: 600 })
  .resize(512, 512)
  .png()
  .toFile('public/maskable-icon-512x512.png');
console.log('✔ maskable-icon-512x512.png generated');
