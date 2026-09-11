import "server-only";
import sharp from "sharp";
import { RequestError } from "./http";
import { MAX_UPLOAD_BYTES } from "./portfolio-types";
export async function optimizePhoto(input: Uint8Array) {
  if (!input.byteLength || input.byteLength > MAX_UPLOAD_BYTES) throw new RequestError(413);
  const bytes = Buffer.from(input);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!jpeg && !png && !webp) throw new RequestError(415);
  try {
    const image = sharp(bytes, { limitInputPixels: 40000000, failOn: "warning" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || !["jpeg", "png", "webp"].includes(meta.format ?? "") || (meta.pages ?? 1) !== 1) throw new RequestError(415);
    // Auto-orient before stripping EXIF (including GPS). Never keepMetadata().
    const output = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).timeout({ seconds: 12 }).toBuffer();
    if (output.byteLength > MAX_UPLOAD_BYTES) throw new RequestError(413);
    return output;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(415);
  }
}
