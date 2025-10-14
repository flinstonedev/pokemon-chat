import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                surface: {
                    1: "var(--surface-1)",
                    2: "var(--surface-2)",
                    3: "var(--surface-3)",
                },
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@assistant-ui/react/tailwindcss"),
        // Custom plugin for gradient utilities
        plugin(({ addUtilities }) => {
            addUtilities({
                '.bg-gradient-primary': {
                    background: 'var(--gradient-primary)',
                },
                '.bg-gradient-accent': {
                    background: 'var(--gradient-accent)',
                },
                '.bg-gradient-surface': {
                    background: 'var(--gradient-surface)',
                },
            });
        }),
    ],
};

export default config;
