import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "pdf-parse", "heic-convert", "pdf-lib", "docx"],
};

export default nextConfig;
