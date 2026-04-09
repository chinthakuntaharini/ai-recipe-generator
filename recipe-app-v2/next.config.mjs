import { createAmplifyAdapter } from '@aws-amplify/adapter-nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default createAmplifyAdapter(nextConfig);
