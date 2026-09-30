// Video real del Buzo fit (FIT.mp4 del cliente): versión web sin audio (solo traía
// música), primeros 18 s (etiqueta MAGIC WORLD, cierre y elasticidad de la tela),
// H.264 con faststart + póster WebP. Requiere ffmpeg (FFMPEG=ruta o en el PATH).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const FFMPEG =
  process.env.FFMPEG ||
  'C:/Users/Lenovo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe';
const SRC = 'assets/source/fit-video.mp4';
const OUT = 'public/video';
const hash = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const tmp = path.join(OUT, 'fit.mp4');
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', SRC, '-t', '18', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', tmp]);
const video = `fit.${hash(tmp)}.mp4`;
fs.renameSync(tmp, path.join(OUT, video));

const frame = path.join(OUT, 'poster.png');
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', '0.4', '-i', SRC, '-frames:v', '1', frame]);
const posterBuf = await sharp(frame).webp({ quality: 80 }).toBuffer();
fs.rmSync(frame);
const posterName = `fit-poster.${crypto.createHash('md5').update(posterBuf).digest('hex').slice(0, 8)}.webp`;
fs.writeFileSync(path.join(OUT, posterName), posterBuf);
const meta = await sharp(posterBuf).metadata();

const data = { src: `/video/${video}`, poster: `/video/${posterName}`, w: meta.width, h: meta.height, seconds: 18 };
fs.writeFileSync('src/data/video.json', JSON.stringify(data, null, 2) + '\n');
console.log(data, `${(fs.statSync(path.join(OUT, video)).size / 1024).toFixed(0)} KB`);
