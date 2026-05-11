const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'D:/jhfyjxpt/public/icon.png';

// Android mipmap density -> pixel size (for standard launcher icons)
const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const BASE = 'D:/jhfyjxpt/android/app/src/main/res';

async function main() {
  const iconBuffer = fs.readFileSync(SRC);

  for (const [dir, size] of Object.entries(SIZES)) {
    const outDir = path.join(BASE, dir);

    // ic_launcher.png - standard icon
    await sharp(iconBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher.png'));

    // ic_launcher_round.png - round icon
    await sharp(iconBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png - adaptive icon foreground (larger for safe zone)
    const fgSize = Math.round(size * 1.5); // 108dp within 72dp viewport
    await sharp(iconBuffer)
      .resize(fgSize, fgSize)
      .png()
      .toFile(path.join(outDir, 'ic_launcher_foreground.png'));

    console.log(`✅ ${dir} → ${size}px (fg: ${fgSize}px)`);
  }

  console.log('\n🎉 All Android icons generated!');
}

main().catch(console.error);
