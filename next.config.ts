import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Bilder von Supabase Storage erlauben
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },

    // Redirects
    async redirects() {
        return [
            {
                source: '/auth/login',
                destination: '/login',
                permanent: true,
            },
            {
                source: '/auth/register',
                destination: '/registrieren',
                permanent: true,
            },
            {
                source: '/register',
                destination: '/registrieren',
                permanent: true,
            },
        ]
    },

    // Headers für Sicherheit
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ]
    },
}

export default nextConfig
