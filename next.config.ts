import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "pdfjs-dist", "heic-convert", "pdf-lib", "docx"],
};

export default nextConfig;
