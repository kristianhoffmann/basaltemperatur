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
                    50: '#FFF1EE',
                    100: '#FFE1DB',
                    200: '#FFC4BA',
                    300: '#FF9E8F',
                    400: '#FB7566',
                    500: '#E64A3B',
                    600: '#CC3026',
                    700: '#A8241C',
                    800: '#851D17',
                    900: '#5A1410',
                },
                primary: {
                    DEFAULT: '#CC3026',
                    50: '#FFF1EE',
                    100: '#FFE1DB',
                    200: '#FFC4BA',
                    300: '#FF9E8F',
                    400: '#FB7566',
                    500: '#E64A3B',
                    600: '#CC3026',
                    700: '#A8241C',
                    800: '#851D17',
                    900: '#5A1410',
                },
                paper: {
                    DEFAULT: '#FFF8F1',
                    deep: '#FBEDE3',
                    line: '#EADDD2',
                },
                ink: {
                    DEFAULT: '#1B1233',
                    soft: '#4A4263',
                    muted: '#6A6384',
                },
                // Thermal scale: cool = low readings, warm = high readings.
                cool: {
                    100: '#E4E9FF',
                    200: '#C9D4FF',
                    400: '#8FA2FF',
                    600: '#3D4FE0',
                },
                warm: {
                    100: '#FFD9D2',
                    300: '#FF9E8F',
                    400: '#FF7A6B',
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
                    50: '#E4E9FF',
                    400: '#3D4FE0',
                },
            },
            fontFamily: {
                sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
                heading: ['var(--font-heading)', 'var(--font-body)', 'system-ui', 'sans-serif'],
                display: ['var(--font-heading)', 'var(--font-body)', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '14px',
                '3xl': '18px',
                '4xl': '24px',
            },
            boxShadow: {
                soft: '0 1px 2px rgba(60, 40, 50, 0.05)',
                card: '0 1px 2px rgba(60, 40, 50, 0.04), 0 10px 28px -14px rgba(60, 40, 50, 0.14)',
                glow: '0 10px 28px -10px rgba(204, 48, 38, 0.5)',
                strong: '0 24px 60px -24px rgba(27, 18, 51, 0.35)',
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
