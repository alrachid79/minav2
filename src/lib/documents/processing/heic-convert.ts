import "server-only";

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const convert = (await import("heic-convert")).default as (input: {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality: number;
  }) => Promise<ArrayBuffer>;

  const output = await convert({
    buffer,
    format: "JPEG",
    quality: 0.92,
  });

  return Buffer.from(output);
}
