import { createCanvas, loadImage } from '@napi-rs/canvas';

const CANVAS_W   = 1200;
const CANVAS_H   = 630;
const AVATAR_W   = 500;
const FADE_START = 200;
const FADE_END   = 500;
const TEXT_X     = 540;
const TEXT_MAX_W = CANVAS_W - TEXT_X - 50;
const FONT       = '"Segoe UI", Arial, sans-serif';

function breakWord(ctx, word, maxWidth) {
  const segments = [];
  let seg = '';
  for (const ch of [...word]) {
    const test = seg + ch;
    if (ctx.measureText(test).width > maxWidth && seg) {
      segments.push(seg);
      seg = ch;
    } else {
      seg = test;
    }
  }
  if (seg) segments.push(seg);
  return segments;
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const para of text.split('\n')) {
    let current = '';
    for (const word of para.split(' ')) {
      if (ctx.measureText(word).width > maxWidth) {
        if (current) { lines.push(current); current = ''; }
        const chunks = breakWord(ctx, word, maxWidth);
        for (let i = 0; i < chunks.length - 1; i++) lines.push(chunks[i]);
        current = chunks[chunks.length - 1];
        continue;
      }
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) { lines.push(current); current = ''; }
  }
  return lines;
}

function baseFontSize(len) {
  if (len < 30)  return 64;
  if (len < 60)  return 52;
  if (len < 120) return 40;
  if (len < 200) return 32;
  return 26;
}

export async function generateQuote({ text, displayName, tag, avatarUrl }) {
  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (avatarUrl) {
    try {
      ctx.drawImage(await loadImage(avatarUrl), 0, 0, AVATAR_W, CANVAS_H);
    } catch {}
  }

  const fade = ctx.createLinearGradient(FADE_START, 0, FADE_END, 0);
  fade.addColorStop(0.00, 'rgba(0,0,0,0)');
  fade.addColorStop(0.20, 'rgba(0,0,0,0.2)');
  fade.addColorStop(0.50, 'rgba(0,0,0,0.6)');
  fade.addColorStop(0.85, 'rgba(0,0,0,0.95)');
  fade.addColorStop(1.00, 'rgba(0,0,0,1)');
  ctx.fillStyle = fade;
  ctx.fillRect(FADE_START, 0, FADE_END - FADE_START, CANVAS_H);
  ctx.fillStyle = '#000';
  ctx.fillRect(FADE_END, 0, CANVAS_W - FADE_END, CANVAS_H);

  const ATTR_H = 102;
  let fontSize = baseFontSize(text.length);
  let lines, lineHeight;
  while (fontSize >= 20) {
    ctx.font = `${fontSize}px ${FONT}`;
    lineHeight = fontSize * 1.55;
    lines = wrapText(ctx, text, TEXT_MAX_W);
    if (lines.length * lineHeight + ATTR_H <= CANVAS_H - 80) break;
    fontSize -= 4;
  }

  const cx = TEXT_X + TEXT_MAX_W / 2;
  let y = Math.max(fontSize + 30, (CANVAS_H - (lines.length * lineHeight + ATTR_H)) / 2 + fontSize);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const line of lines) { ctx.fillText(line, cx, y); y += lineHeight; }

  y += 28;
  ctx.font = `28px ${FONT}`;
  ctx.fillText(`- ${displayName}`, cx, y);

  y += 38;
  ctx.font = `22px ${FONT}`;
  ctx.fillStyle = 'rgba(170,170,170,0.85)';
  ctx.fillText(tag, cx, y);

  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = 'rgba(100,100,100,0.75)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Make it a Quote', CANVAS_W - 20, CANVAS_H - 16);

  return canvas.toBuffer('image/png');
}
