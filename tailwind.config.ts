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
                // Brand accent ("Hagebutte"). `primary` is an alias: older form and UI
                // components use primary-*, which silently produced no CSS before.
                rose: {
                    50: '#FBF1F2',
                    100: '#F7E4E7',
                    200: '#EFC6CD',
                    300: '#E3A0AC',
                    400: '#D27488',
                    500: '#C2566D',
                    600: '#B4455C',
                    700: '#963A4D',
                    800: '#74303E',
                    900: '#4E222B',
                },
                primary: {
                    DEFAULT: '#B4455C',
                    50: '#FBF1F2',
                    100: '#F7E4E7',
                    200: '#EFC6CD',
                    300: '#E3A0AC',
                    400: '#D27488',
                    500: '#C2566D',
                    600: '#B4455C',
                    700: '#963A4D',
                    800: '#74303E',
                    900: '#4E222B',
                },
                paper: {
                    DEFAULT: '#FAF7F2',
                    deep: '#F2EDE4',
                    line: '#E7E0D6',
                },
                ink: {
                    DEFAULT: '#221A24',
                    soft: '#4E4553',
                    muted: '#716877',
                },
                gold: {
                    300: '#DDB877',
                    400: '#C99A45',
                    500: '#946016',
                },
                period: {
                    50: '#FBE9EC',
                    400: '#C8475D',
                },
                ovulation: {
                    50: '#ECE8F3',
                    400: '#5B4A78',
                },
            },
            fontFamily: {
                sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
                heading: ['var(--font-heading)', 'Georgia', 'serif'],
                display: ['var(--font-heading)', 'Georgia', 'serif'],
            },
            borderRadius: {
                '2xl': '14px',
                '3xl': '18px',
                '4xl': '24px',
            },
            boxShadow: {
                soft: '0 1px 2px rgba(60, 40, 50, 0.05)',
                card: '0 1px 2px rgba(60, 40, 50, 0.04), 0 10px 28px -14px rgba(60, 40, 50, 0.14)',
                glow: '0 6px 18px -6px rgba(180, 69, 92, 0.35)',
                strong: '0 18px 48px -20px rgba(60, 40, 50, 0.28)',
            },
            backdropBlur: {
                card: '20px',
                nav: '24px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
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
                    '0%, 100%': { boxShadow: '0 6px 18px -6px rgba(180, 69, 92, 0.30)' },
                    '50%': { boxShadow: '0 6px 18px -6px rgba(180, 69, 92, 0.30)' },
                },
            },
        },
    },
    plugins: [],
}

export default config
