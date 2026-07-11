import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@commerceflow/types",
    "@commerceflow/utils",
    "@commerceflow/validation",
  ],
};

export default nextConfig;
