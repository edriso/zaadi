import type { NextConfig } from 'next';
import { basePath } from './site.config.mjs';
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
};
export default nextConfig;
