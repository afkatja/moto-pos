import { rename } from "node:fs/promises"
import { join } from "node:path"

const out = "docs/public/api-typedoc"

await rename(join(out, "index.html"), join(out, "start.html"))
