import type { Config } from 'tailwindcss';

export default {
  darkMode: 'media', // Enable dark mode via the `dark` class
  content: [
    './components/**/*.{js,ts,jsx,tsx}', // Include all files in `components`
    './app/**/*.{js,ts,jsx,tsx}', // Include files if you're using the `app` directory
  ],
  theme: {
    extend: {
      colors: {
        pastelPurple: '#C6B4FF',
        backgroundLight: '#F7F7FF',
        backgroundDark: '#0E1024',
        textLight: '#0F1024',
        textDark: '#E9EAF7',
        accentLight: '#FF8EC7',
        accentDark: '#FF6EC7',
        ink: '#0B0C1C',
        muted: '#6B7280',
        surface: '#FFFFFF',
        surfaceMuted: '#F2F2FB',
        panelLight: '#FFFFFF',
        panelLightAlt: '#F4F1FF',
        panelDark: '#141836',
        panelDarkAlt: '#1B2148',
        borderLight: '#E4DDFF',
        borderDark: '#262C52',
      },
      spacing: {
        4.5: '1.125rem', // Custom spacing: 4.5 = 18px
        18: '4.5rem', // Custom spacing: 18 = 72px
        72: '18rem', // Custom spacing: 72 = 288px
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
        display: [
          'var(--font-poppins)',
          'var(--font-space-grotesk)',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', '1rem'], // Extra small
        sm: ['0.875rem', '1.25rem'], // Small
        base: ['1rem', '1.5rem'], // Base
        lg: ['1.125rem', '1.75rem'], // Large
        xl: ['1.25rem', '1.75rem'], // Extra large
        '2xl': ['1.5rem', '2rem'], // 2x large
        '3xl': ['2rem', '2.5rem'], // 3x large
        '4xl': ['2.5rem', '3rem'], // 4x large
      },
      borderRadius: {
        xl: '1rem', // 16px
        '2xl': '1.5rem', // 24px
      },
      boxShadow: {
        soft: '0 4px 8px rgba(0, 0, 0, 0.1)', // Custom soft shadow
        heavy: '0 8px 16px rgba(0, 0, 0, 0.2)', // Custom heavy shadow
        glass: '0 12px 40px rgba(124, 58, 237, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
