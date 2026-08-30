import { defineConfig } from "vitepress"
import react from "@vitejs/plugin-react"

export default defineConfig({
  base: "/moto-pos/",
  title: "@moto-pos/core",
  description: "Standalone MOTO POS module for Stripe payment processing",
  vite: {
    plugins: [react()],
    optimizeDeps: {
      include: ["react", "react-dom", "@tanstack/react-query"],
    },
    ssr: {
      noExternal: ["react", "react-dom", "@tanstack/react-query"],
    },
  },
  themeConfig: {
    nav: [
      { text: "UI Preview", link: "/ui-preview" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API Reference", link: "/api" },
      { text: "HTTP API", link: "/http-api" },
      { text: "Theming", link: "/theming" },
      { text: "WordPress", link: "/wp-react-integration" },
    ],
    sidebar: {
      "/guide/": [
        { text: "Getting Started", link: "/guide/getting-started" },
        { text: "Idempotency Stores", link: "/guide/idempotency" },
        { text: "React Components", link: "/guide/react-components" },
        { text: "Supabase Auth", link: "/guide/supabase-auth" },
      ],
      "/api/": [
        { text: "Core", link: "/api/core" },
        { text: "React", link: "/api/react" },
        { text: "Store", link: "/api/store" },
        { text: "Tokens", link: "/api/tokens" },
        { text: "Strings", link: "/api/strings" },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/afkatja/moto-pos" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present",
    },
  },
})
