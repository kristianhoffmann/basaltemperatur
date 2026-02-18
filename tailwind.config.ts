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
                '3xl': '20px',
                '4xl': '28px',
            },
            boxShadow: {
                soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
                card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.03)',
                glow: '0 4px 20px rgba(232, 120, 138, 0.25)',
                strong: '0 8px 40px rgba(232, 120, 138, 0.18)',
            },
            backdropBlur: {
                card: '20px',
                nav: '24px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'float': 'float 4s ease-in-out infinite',
                'glow': 'glowPulse 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.85', transform: 'scale(1.03)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 4px 20px rgba(232, 120, 138, 0.25)' },
                    '50%': { boxShadow: '0 8px 40px rgba(232, 120, 138, 0.35)' },
                },
            },
        },
    },
    plugins: [],
}

export default config
