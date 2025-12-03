const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		screens: {
			xs: "475px",
			...defaultTheme.screens
		},
		extend: {
			colors: {
				main: "#6161ff",
				zinc: {
					80: "#f7f7f7",
					450: "#85858f"
				},
				brown: {
					50: "#faf8f6",
					100: "#f5f1eb",
					200: "#e8ddd0",
					300: "#d4c2ab",
					400: "#b99d7f",
					500: "#a08266",
					600: "#8b6f52",
					700: "#735a45",
					800: "#5f4b3a",
					900: "#4f3f32"
				}
			},
			fontSize: {
				"code-sm": "0.825rem",
				"code-base": "0.925rem",
				"code-lg": "1.12rem",
				"code-xl": "1.2rem",
				"code-2xl": "1.45rem",
				"code-3xl": "1.825rem",
				"code-4xl": "2.15rem",
				"code-5xl": "2.9rem"
			}
		}
	},
	plugins: []
};
