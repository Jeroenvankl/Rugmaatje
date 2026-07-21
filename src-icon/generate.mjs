import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const jobs = [
  { src: "icon.svg", out: "icon-192.png", size: 192 },
  { src: "icon.svg", out: "icon-512.png", size: 512 },
  { src: "icon.svg", out: "apple-touch-icon.png", size: 180 },
  { src: "icon.svg", out: "favicon-32.png", size: 32 },
  { src: "icon-maskable.svg", out: "icon-maskable-192.png", size: 192 },
  { src: "icon-maskable.svg", out: "icon-maskable-512.png", size: 512 },
];

for (const job of jobs) {
  const srcPath = path.join(__dirname, job.src);
  const outPath = path.join(outDir, job.out);
  await sharp(srcPath).resize(job.size, job.size).png().toFile(outPath);
  console.log("gegenereerd:", outPath);
}
