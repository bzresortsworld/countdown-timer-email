// File: api/countdown.js

import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to register Commissioner font, fallback to system font if not found
try {
  const fontPath = path.join(__dirname, 'fonts', 'Commissioner-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: 'Commissioner' });
  }
} catch (e) {
  console.warn('Commissioner font not available, falling back to default.');
}

export default async function handler(req, res) {
  const {
    to,
    format = 'HH:MM:SS',
    tz = 'UTC',
    fontSize = '48',
    fontWeight = 'bold',
    fontFamily = 'Commissioner',
    bgColor = '#ffffff',
    textColor = '#d7182a',
    width = '400',
    height = '120'
  } = req.query;

  if (!to) {
    res.status(400).send('Missing "to" parameter in ISO format');
    return;
  }

  const expiration = new Date(to);
  const now = new Date();
  let diff = Math.max(0, expiration.getTime() - now.getTime());

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let text;
  switch (format) {
    case 'DD:HH:MM:SS':
      text = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      break;
    case 'HH:MM:SS':
    default:
      const totalHrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSeconds % 60).padStart(2, '0');
      text = `${totalHrs}:${mins}:${secs}`;
      break;
  }

  const w = parseInt(width, 10);
  const h = parseInt(height, 10);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = textColor;
  const font = `${fontWeight} ${fontSize}px "${fontFamily}", Arial`;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  canvas.createPNGStream().pipe(res);
}
