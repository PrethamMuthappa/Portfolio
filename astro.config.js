import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

export default defineConfig({
	vite: {
		plugins: [tailwindcss()]
	},
	output: "server",
	adapter: vercel({
 		webAnalytics: { enabled: true }
	}),
	site: "https://prethambachira.vercel.app"
});
