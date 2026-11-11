// Generates favicon + app icons + Open Graph images (1200x630) per locale.
// Run with: npm run og   (outputs to /public, commit the results)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const font = (p) => fs.readFile(path.join(root, 'node_modules', p));

const fonts = [
  { name: 'Bricolage', data: await font('@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff'), weight: 700 },
  { name: 'Manrope', data: await font('@fontsource/manrope/files/manrope-latin-600-normal.woff'), weight: 600 },
  { name: 'Instrument', data: await font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff'), weight: 400 },
];

const h = (type, style, children) => ({ type, props: { style, children } });

const C = { primary: '#7C3AED', light: '#EDE6FF', accent: '#A9CDF2', ink: '#262130', bg: '#F7F6FA' };

const mark = (size) =>
  h(
    'div',
    {
      width: size,
      height: size,
      borderRadius: size,
      background: C.primary,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Instrument',
      fontSize: Math.round(size * 0.68),
      lineHeight: 1,
      paddingTop: Math.round(size * 0.04),
    },
    'M',
  );

async function svg(node, width, height) {
  return satori(node, { width, height, fonts });
}

async function writePng(node, width, height, file) {
  const s = await svg(node, width, height);
  await sharp(Buffer.from(s)).png({ compressionLevel: 9 }).toFile(path.join(pub, file));
  console.log('✓', file);
}

// Favicon (SVG with outlined glyph, no font dependency)
const favSvg = await svg(mark(64), 64, 64);
await fs.writeFile(path.join(pub, 'favicon.svg'), favSvg);
console.log('✓ favicon.svg');

// favicon.ico (single 32px PNG inside an ICO container)
const png32 = await sharp(Buffer.from(await svg(mark(32), 32, 32))).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt8(0, 8);
header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);
await fs.writeFile(path.join(pub, 'favicon.ico'), Buffer.concat([header, png32]));
console.log('✓ favicon.ico');

// Touch / manifest icons: mark on a light tile
const tile = (size) =>
  h('div', { width: size, height: size, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }, [
    mark(Math.round(size * 0.72)),
  ]);
await writePng(tile(180), 180, 180, 'apple-touch-icon.png');
await writePng(tile(192), 192, 192, 'icon-192.png');
await writePng(tile(512), 512, 512, 'icon-512.png');

// Open Graph
const og = (pill, l1, l2) =>
  h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      position: 'relative',
      background: C.bg,
      fontFamily: 'Manrope',
      color: C.ink,
      overflow: 'hidden',
    },
    [
      h('div', { position: 'absolute', right: -140, top: -160, width: 560, height: 560, borderRadius: 560, background: C.light }),
      h('div', { position: 'absolute', right: -60, bottom: -220, width: 420, height: 420, borderRadius: 420, background: C.accent, opacity: 0.9 }),
      h('div', { display: 'flex', flexDirection: 'column', padding: '64px 72px', width: '100%', height: '100%' }, [
        h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
          mark(56),
          h('div', { fontFamily: 'Bricolage', fontSize: 40, letterSpacing: -0.8 }, 'Medicore'),
        ]),
        h(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 64,
            alignSelf: 'flex-start',
            background: C.light,
            borderRadius: 999,
            padding: '12px 22px',
            fontSize: 24,
          },
          [h('div', { width: 12, height: 12, borderRadius: 12, background: C.primary }), pill],
        ),
        h(
          'div',
          {
            display: 'flex',
            flexDirection: 'column',
            marginTop: 28,
            fontFamily: 'Bricolage',
            fontSize: 84,
            lineHeight: 0.98,
            letterSpacing: -3.6,
            maxWidth: 940,
          },
          [h('div', {}, l1), h('div', { color: C.primary }, l2)],
        ),
        h('div', { marginTop: 'auto', fontSize: 24, color: 'rgba(38,33,48,0.7)' }, 'medicoresv.health'),
      ]),
    ],
  );

const es = JSON.parse(await fs.readFile(path.join(root, 'src/i18n/es.json'), 'utf8'));
const en = JSON.parse(await fs.readFile(path.join(root, 'src/i18n/en.json'), 'utf8'));
await writePng(og(es.hero.pill, es.hero.l1, es.hero.l2), 1200, 630, 'og-es.png');
await writePng(og(en.hero.pill, en.hero.l1, en.hero.l2), 1200, 630, 'og-en.png');
