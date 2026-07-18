import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@commerceflow/types", "@commerceflow/validation"],
};

export default nextConfig;
