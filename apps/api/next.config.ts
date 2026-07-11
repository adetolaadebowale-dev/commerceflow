import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@commerceflow/api-client",
    "@commerceflow/types",
    "@commerceflow/utils",
    "@commerceflow/validation",
  ],
};

export default nextConfig;
