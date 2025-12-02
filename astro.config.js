import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from '@astrojs/vercel/serverless';


export default defineConfig({
	integrations: [tailwind()],
	output: 'server',
	adapter: vercel({
 		webAnalytics: { enabled: true }
	}),
	site: "https://prethambachira.vercel.app"
});

