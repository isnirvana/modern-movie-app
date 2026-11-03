// Renders the icons for the app shortcuts (long-press the app icon): the logo's gradient with a white glyph
import sharp from 'sharp';

// Lucide glyphs (24×24, stroked)
const glyphs = {
  continue: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'my-list': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
};

const icon = (glyph) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6c63ff"/>
      <stop offset="1" stop-color="#f72585"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#g)"/>
  <g transform="translate(16 16) scale(1.333)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
</svg>`;

for (const [name, glyph] of Object.entries(glyphs)) {
  await sharp(Buffer.from(icon(glyph)), { density: 300 })
    .resize(96, 96)
    .png()
    .toFile(`public/shortcut-${name}.png`);
  console.log(`✔ shortcut-${name}.png generated`);
}
