import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SalesPilot AI',
    short_name: 'SalesPilot',
    description: 'AI-powered sales content generation',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
  };
}
