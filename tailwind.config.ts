import type { Config } from "tailwindcss";

export default {
    darkMode: "media", // Enable dark mode via the `dark` class
    content: [
        "./components/**/*.{js,ts,jsx,tsx}", // Include all files in `components`
        "./app/**/*.{js,ts,jsx,tsx}", // Include files if you're using the `app` directory
    ],
    theme: {
        extend: {
            colors: {
                // Light theme colors
                pastelPurple: "#C3A6FF",
                backgroundLight: "#FFFFFF",
                textLight: "#333333",
                accentLight: "#FFB6C1", // Light pink for accents

                // Dark theme colors
                backgroundDark: "#1E1E2E",
                textDark: "#E2E2E2",
                accentDark: "#FF6EC7", // Vibrant pink for accents
            },
            spacing: {
                4.5: "1.125rem", // Custom spacing: 4.5 = 18px
                18: "4.5rem", // Custom spacing: 18 = 72px
                72: "18rem", // Custom spacing: 72 = 288px
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
                display: ["var(--font-poppins)", "sans-serif"],
            },
            fontSize: {
                xs: ["0.75rem", "1rem"], // Extra small
                sm: ["0.875rem", "1.25rem"], // Small
                base: ["1rem", "1.5rem"], // Base
                lg: ["1.125rem", "1.75rem"], // Large
                xl: ["1.25rem", "1.75rem"], // Extra large
                "2xl": ["1.5rem", "2rem"], // 2x large
                "3xl": ["2rem", "2.5rem"], // 3x large
                "4xl": ["2.5rem", "3rem"], // 4x large
            },
            borderRadius: {
                xl: "1rem", // 16px
                "2xl": "1.5rem", // 24px
            },
            boxShadow: {
                soft: "0 4px 8px rgba(0, 0, 0, 0.1)", // Custom soft shadow
                heavy: "0 8px 16px rgba(0, 0, 0, 0.2)", // Custom heavy shadow
            },
        },
    },
    plugins: [],
} satisfies Config;
