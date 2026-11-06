import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("vendor", { recursive: true });

copyFileSync("node_modules/phenomenon/dist/phenomenon.mjs", "vendor/phenomenon.js");

const cobe = readFileSync("node_modules/cobe/dist/index.esm.js", "utf8").replace(
  'from"phenomenon"',
  'from"./phenomenon.js"'
);
writeFileSync(
  "vendor/cobe.js",
  "/* cobe 0.6.5 (MIT) https://github.com/shuding/cobe — bundled with phenomenon 1.6.0 (MIT) for script-src 'self'. */\n" +
    cobe
);

copyFileSync("node_modules/gsap/dist/gsap.min.js", "vendor/gsap.min.js");
copyFileSync("node_modules/gsap/dist/ScrollTrigger.min.js", "vendor/ScrollTrigger.min.js");
