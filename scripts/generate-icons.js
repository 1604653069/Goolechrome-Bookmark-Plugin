import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sizes = [16, 48, 128];

async function generateIcons() {
  const inputFile = join(__dirname, '..', 'public', 'icons', 'icon.svg');
  
  for (const size of sizes) {
    const outputFile = join(__dirname, '..', 'public', 'icons', `icon${size}.png`);
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error);