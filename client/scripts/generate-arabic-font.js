import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AMIRI_FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'lib', 'fonts');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'amiri-regular.js');

console.log('Downloading Amiri font...');

function downloadFont(url) {
  https.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
      console.log('Following redirect...');
      downloadFont(response.headers.location);
      return;
    }

    if (response.statusCode !== 200) {
      console.error(`Failed to download font: ${response.statusCode}`);
      process.exit(1);
    }

    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');

      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      const fileContent = `// Auto-generated Amiri font for jsPDF
// Do not edit manually
export default "${base64}";
`;

      fs.writeFileSync(OUTPUT_FILE, fileContent);
      console.log(`Font generated successfully at: ${OUTPUT_FILE}`);
      console.log(`File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    });
  }).on('error', (err) => {
    console.error('Error downloading font:', err);
    process.exit(1);
  });
}

downloadFont(AMIRI_FONT_URL);
