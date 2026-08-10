import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/pdfkit/js/data/**",
      "./Sajid-Hossain-Resume.pdf",
    ],
    "/**/*": [
      "./node_modules/pdfkit/js/data/**",
      "./Sajid-Hossain-Resume.pdf",
    ],
  },
};

export default nextConfig;
