// Testimonio en video de un cliente (testimonio.mp4, enviado por el cliente el 2026-10-01):
// versión web CON audio (es una persona hablando), volumen normalizado, 30 fps, H.264 con
// faststart + póster WebP en el segundo 9 (se ve el hoodie completo con el cordón cruzado).
// Requiere ffmpeg (FFMPEG=ruta o en el PATH).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const FFMPEG =
  process.env.FFMPEG ||
  'C:/Users/Lenovo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe';
const SRC = 'assets/source/testimonio.mp4';
const OUT = 'public/testimonio';
const POSTER_AT = '9.0';
const hash = (buf) => crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const tmp = path.join(OUT, 'testimonio.mp4');
// prettier-ignore
execFileSync(FFMPEG, [
  '-y', '-loglevel', 'error', '-i', SRC,
  '-vf', 'fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '1', '-c:a', 'aac', '-b:a', '96k',
  '-movflags', '+faststart', tmp,
]);
const video = `testimonio.${hash(fs.readFileSync(tmp))}.mp4`;
fs.renameSync(tmp, path.join(OUT, video));

const frame = path.join(OUT, 'poster.png');
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', POSTER_AT, '-i', SRC, '-frames:v', '1', frame]);
const posterBuf = await sharp(frame).webp({ quality: 82 }).toBuffer();
fs.rmSync(frame);
const posterName = `testimonio-poster.${hash(posterBuf)}.webp`;
fs.writeFileSync(path.join(OUT, posterName), posterBuf);
const meta = await sharp(posterBuf).metadata();

const seconds = Number(
  execFileSync(FFMPEG.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(OUT, video)])
    .toString()
    .trim(),
);
const data = { src: `/testimonio/${video}`, poster: `/testimonio/${posterName}`, w: meta.width, h: meta.height, seconds: Math.round(seconds * 10) / 10 };
fs.writeFileSync('src/data/testimonial.json', JSON.stringify(data, null, 2) + '\n');
console.log(data, `${(fs.statSync(path.join(OUT, video)).size / 1024).toFixed(0)} KB`);
