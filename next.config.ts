import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Streaming-Metadata: Next.js schiebt <title>/<meta> normalerweise erst spaet in
    // den Body und verlaesst sich darauf, dass der Client sie in den <head> hebt.
    // Fuer die hier gelisteten Bots wird stattdessen blockierend gerendert, d.h. die
    // Metadaten stehen direkt im <head>.
    //
    // Next.js deckt Social-Scraper (Slackbot, Twitterbot, facebookexternalhit) und
    // bingbot bereits ab — KI-Crawler aber nicht. Die fuehren kein JavaScript aus und
    // saehen sonst eine Seite voellig ohne Titel und Description.
    htmlLimitedBots:
        /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Perplexity-User|CCBot|Google-Extended|Applebot-Extended|Bytespider|Amazonbot|meta-externalagent|cohere-ai|Diffbot|omgili/i,

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

    // Rewrites: IndexNow key file
    async rewrites() {
        const key = process.env.SEO_AUTOPILOT_INDEXNOW_KEY
        if (!key) return []
        return [
            {
                source: `/${key}.txt`,
                destination: '/api/seo-autopilot/indexnow-key',
            },
        ]
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
