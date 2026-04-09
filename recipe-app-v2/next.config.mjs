import { withAmplifyAdapter } from '@aws-amplify/adapter-nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withAmplifyAdapter(nextConfig);
