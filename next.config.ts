import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Use project dir as tracing root (helps with OneDrive/parent lockfile on Windows)
  outputFileTracingRoot: path.resolve(__dirname),
  // Disable typed routes to avoid EINVAL readlink on Windows/OneDrive
  typedRoutes: false,
};

export default nextConfig;
