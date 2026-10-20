// Renders the icon and splash sources in resources/ from the official brand SVGs, then
// `npx capacitor-assets generate --android --ios` produces every platform size.
//   node scripts/brand-assets.mjs [path/to/fitapp/brand/svg]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const brand = resolve(process.argv[2] ?? new URL('../../fitapp/brand/svg', import.meta.url).pathname)
const out = (name) => resolve(new URL('../resources', import.meta.url).pathname, name)

const TEAL = '#087F72' // brand master teal (brand/README.txt)
const CANVAS = '#f1f2f5' // app canvas, light
const CANVAS_DARK = '#0f0f0e' // app canvas, dark
const symbol = (colour) => readFileSync(`${brand}/fitapp-symbol-white.svg`, 'utf8').replaceAll('#FFFFFF', colour)

/** The 112×96 symbol scaled to `width`, centred on a square of `size`. */
async function symbolOn(size, width, colour, background) {
  const art = await sharp(Buffer.from(symbol(colour)), { density: 1200 }).resize({ width }).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background } }).composite([{ input: art, gravity: 'center' }]).png()
}

// Full icon (iOS, legacy Android): the brand's own app-icon artwork.
await sharp(readFileSync(`${brand}/fitapp-app-icon.svg`), { density: 300 }).resize(1024, 1024).png().toFile(out('icon-only.png'))
// Android adaptive icon: the symbol inside the 66 % safe zone on the brand teal.
await (await symbolOn(1024, 470, '#FFFFFF', { r: 0, g: 0, b: 0, alpha: 0 })).toFile(out('icon-foreground.png'))
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: TEAL } }).png().toFile(out('icon-background.png'))
// Splash: the symbol on the app's own canvas, light and dark.
await (await symbolOn(2732, 520, TEAL, CANVAS)).toFile(out('splash.png'))
await (await symbolOn(2732, 520, '#FFFFFF', CANVAS_DARK)).toFile(out('splash-dark.png'))
console.log('resources/ updated')
