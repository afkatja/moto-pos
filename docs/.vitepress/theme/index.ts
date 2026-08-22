import DefaultTheme from "vitepress/theme"
import "@moto-pos/core/tokens.css"
import MotoChargePanel from "../components/MotoChargePanel.vue"

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component("MotoChargePanel", MotoChargePanel)
  },
}
