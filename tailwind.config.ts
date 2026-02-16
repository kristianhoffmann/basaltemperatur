import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                rose: {
                    50: '#FDF2F4',
                    100: '#FACDD6',
                    200: '#F5A3B5',
                    300: '#F2919F',
                    400: '#E8788A',
                    500: '#D4637A',
                    600: '#B84D65',
                    700: '#8A3A4D',
                    800: '#5D2735',
                    900: '#3D1520',
                },
                gold: {
                    300: '#E0BB92',
                    400: '#D4A574',
                    500: '#C08E5A',
                },
                period: {
                    50: '#FDE8EC',
                    400: '#E85D75',
                },
                ovulation: {
                    50: '#E8E3FF',
                    400: '#7B61FF',
                },
            },
            fontFamily: {
                sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
                heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '24px',
            },
            boxShadow: {
                soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
                card: '0 2px 16px rgba(0, 0, 0, 0.06)',
                glow: '0 4px 20px rgba(232, 120, 138, 0.25)',
                strong: '0 8px 32px rgba(232, 120, 138, 0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.85', transform: 'scale(1.03)' },
                },
            },
        },
    },
    plugins: [],
}

export default config
