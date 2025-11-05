#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs'
import path from 'node:path'

async function main() {
  const sharp = (await import('sharp')).default
  const publicDir = path.resolve(process.cwd(), 'public')
  const srcSvg = path.join(publicDir, 'wazhop-icon.svg')
  const out192 = path.join(publicDir, 'icon-192.png')
  const out512 = path.join(publicDir, 'icon-512.png')
  const outApple = path.join(publicDir, 'apple-touch-icon.png')

  if (!fs.existsSync(srcSvg)) {
    console.error(`[generate-icons] Missing ${srcSvg}. Skipping.`)
    process.exit(0)
  }

  try {
    await sharp(srcSvg)
      .resize(192, 192, { fit: 'contain', background: { r: 16, g: 185, b: 129, alpha: 1 } })
      .png({ quality: 90 })
      .toFile(out192)
    console.log(`[generate-icons] Wrote ${out192}`)

    await sharp(srcSvg)
      .resize(512, 512, { fit: 'contain', background: { r: 16, g: 185, b: 129, alpha: 1 } })
      .png({ quality: 92 })
      .toFile(out512)
    console.log(`[generate-icons] Wrote ${out512}`)

    await sharp(srcSvg)
      .resize(180, 180, { fit: 'contain', background: { r: 16, g: 185, b: 129, alpha: 1 } })
      .png({ quality: 90 })
      .toFile(outApple)
    console.log(`[generate-icons] Wrote ${outApple}`)
  } catch (err) {
    console.error('[generate-icons] Error generating icons:', err)
    process.exit(1)
  }
}

main()
