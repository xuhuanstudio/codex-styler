import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://xuhuanstudio.github.io",
  base: "/codex-styler",
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          zh: "zh-CN",
        },
      },
    }),
  ],
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});

