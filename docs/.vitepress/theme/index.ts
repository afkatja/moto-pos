import DefaultTheme from "vitepress/theme"
import "../../../src/tokens/index.css"
import MotoChargePanel from "../components/MotoChargePanel.vue"

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component("MotoChargePanel", MotoChargePanel)
  },
}
