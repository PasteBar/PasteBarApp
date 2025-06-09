var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// package.json
var require_package = __commonJS({
  "package.json"(exports, module) {
    module.exports = {
      name: "pastebar-app-ui",
      version: "0.6.2",
      private: true,
      scripts: {
        dev: "vite",
        start: "npm run dev",
        build: "vite build",
        "build:ts": "tsc && vite build",
        format: "npx prettier --write . --ignore-path .gitignore ",
        taze: "taze major -I",
        "taze:minor": "taze minor -w",
        preview: "vite preview",
        "audit:prod": "npm audit --omit=dev"
      },
      dependencies: {
        "@codastic/react-positioning-portal": "^0.7.0",
        "@dnd-kit/core": "^6.1.0",
        "@dnd-kit/modifiers": "^7.0.0",
        "@dnd-kit/sortable": "^8.0.0",
        "@emotion/css": "^11.11.2",
        "@ianvs/prettier-plugin-sort-imports": "^4.1.1",
        "@preact/signals-react": "^2.0.1",
        "@radix-ui/react-accessible-icon": "^1.0.3",
        "@radix-ui/react-accordion": "^1.1.2",
        "@radix-ui/react-alert-dialog": "^1.0.5",
        "@radix-ui/react-aspect-ratio": "^1.0.3",
        "@radix-ui/react-avatar": "^1.0.4",
        "@radix-ui/react-checkbox": "^1.0.4",
        "@radix-ui/react-collapsible": "^1.0.3",
        "@radix-ui/react-context-menu": "^2.1.5",
        "@radix-ui/react-dialog": "^1.0.5",
        "@radix-ui/react-dropdown-menu": "^2.0.6",
        "@radix-ui/react-hover-card": "^1.0.7",
        "@radix-ui/react-label": "^2.0.2",
        "@radix-ui/react-menubar": "^1.0.4",
        "@radix-ui/react-navigation-menu": "^1.1.4",
        "@radix-ui/react-popover": "^1.0.7",
        "@radix-ui/react-progress": "^1.0.3",
        "@radix-ui/react-radio-group": "^1.1.3",
        "@radix-ui/react-scroll-area": "^1.0.5",
        "@radix-ui/react-select": "^2.0.0",
        "@radix-ui/react-separator": "^1.0.3",
        "@radix-ui/react-slider": "^1.1.2",
        "@radix-ui/react-slot": "^1.0.2",
        "@radix-ui/react-switch": "^1.0.3",
        "@radix-ui/react-tabs": "^1.0.4",
        "@radix-ui/react-toast": "^1.1.5",
        "@radix-ui/react-toggle": "^1.0.3",
        "@radix-ui/react-toggle-group": "^1.0.4",
        "@radix-ui/react-tooltip": "^1.0.7",
        "@react-aria/i18n": "^3.9.0",
        "@react-aria/utils": "^3.22.0",
        "@react-stately/utils": "^3.9.0",
        "@rollup/plugin-commonjs": "^25.0.7",
        "@svgr/webpack": "^8.1.0",
        "@tanstack/react-query": "5.25.0",
        "@tanstack/react-query-devtools": "5.25.0",
        "@tanstack/react-query-persist-client": "5.25.0",
        "@tauri-apps/api": "^1.5.3",
        "@types/node": "^20.10.0",
        "@uiw/codemirror-extensions-langs": "^4.21.21",
        "@uiw/codemirror-theme-github": "^4.21.21",
        "@uiw/codemirror-theme-vscode": "^4.21.21",
        "@vitejs/plugin-react-swc": "^3.5.0",
        "babel-plugin-react-compiler": "^0.0.0-experimental-696af53-20240625",
        "class-variance-authority": "^0.7.0",
        classnames: "^2.5.1",
        clsx: "^2.0.0",
        cmdk: "^0.2.0",
        codemirror: "^5.65.16",
        "date-fns": "^2.30.0",
        dayjs: "^1.11.10",
        dompurify: "^3.1.3",
        "dot-prop": "^8.0.2",
        dotenv: "^16.4.5",
        emery: "^1.4.2",
        "emoji-picker-react": "^4.5.16",
        "eslint-plugin-react-compiler": "^0.0.0-experimental-51a85ea-20240601",
        events: "^3.3.0",
        facepaint: "^1.2.1",
        "framer-motion": "^10.16.5",
        "garbados-crypt": "^3.0.0-beta",
        "glob-all": "^3.3.1",
        i18next: "^23.10.0",
        "i18next-browser-languagedetector": "^7.2.0",
        "idb-keyval": "^6.2.1",
        "javascript-time-ago": "^2.5.9",
        jotai: "^2.6.0",
        "jotai-zustand": "^0.3.0",
        "js-yaml": "^4.1.0",
        "linkify-it": "^5.0.0",
        "lodash-es": "^4.17.21",
        "lucide-react": "0.363.0",
        "markdown-wasm": "^1.2.0",
        marked: "^12.0.0",
        "marked-terminal": "^7.0.0",
        "next-themes": "^0.2.1",
        overlayscrollbars: "^2.4.5",
        "overlayscrollbars-react": "^0.5.3",
        "prism-react-renderer": "^2.3.1",
        prismjs: "^1.29.0",
        react: "^18.3.1",
        "react-canvas-confetti": "^2.0.7",
        "react-compiler-runtime": "file:./scripts/react-compiler-runtime",
        "react-complex-tree": "^2.2.3",
        "react-day-picker": "^8.9.1",
        "react-dnd": "^16.0.1",
        "react-dnd-html5-backend": "^16.0.1",
        "react-dom": "^18.3.1",
        "react-error-boundary": "^4.0.13",
        "react-hotkeys-hook": "^4.4.1",
        "react-html-props": "^2.0.9",
        "react-i18next": "^14.0.5",
        "react-router-dom": "^6.20.0",
        "react-sub-unsub": "^2.2.7",
        "react-textarea-autosize": "^8.5.3",
        "react-time-ago": "^7.2.1",
        "react-twitter-embed": "^4.0.4",
        "react-use-hoverintent": "^1.3.0",
        "react-virtualized-auto-sizer": "^1.0.20",
        "react-virtuoso": "^4.6.2",
        "react-window": "^1.8.10",
        "react-window-infinite-loader": "^1.0.9",
        recharts: "^2.10.1",
        "resize-observer-polyfill": "^1.5.1",
        rimraf: "^5.0.5",
        rollup: "^4.10.0",
        scriptjs: "^2.5.9",
        "short-unique-id": "^5.0.3",
        "tailwind-scrollbar": "^3.0.5",
        "tailwindcss-animate": "^1.0.7",
        "tauri-plugin-clipboard-api": "^0.5.5",
        "tauri-plugin-log-api": "github:tauri-apps/tauri-plugin-log",
        "tauri-plugin-positioner-api": "github:tauri-apps/tauri-plugin-positioner",
        "ts-deepmerge": "^7.0.0",
        "url-parse": "^1.5.10",
        "use-resize-observer": "^9.1.0",
        "vite-plugin-babel": "^1.2.0",
        "vite-plugin-dynamic-import": "^1.5.0",
        "vite-plugin-static-copy": "^1.0.2",
        zod: "^3.22.2",
        zustand: "^4.4.6",
        "zustand-logger-middleware": "^1.0.9"
      },
      devDependencies: {
        "@changesets/cli": "^2.27.1",
        "@preact/signals-react-transform": "^0.3.1",
        "@tailwindcss/line-clamp": "^0.4.4",
        "@tauri-apps/cli": "^1.5.6",
        "@trivago/prettier-plugin-sort-imports": "^4.3.0",
        "@types/bcryptjs": "^2.4.6",
        "@types/codemirror": "^5.60.15",
        "@types/dompurify": "^3.0.5",
        "@types/events": "^3.0.3",
        "@types/js-yaml": "^4.0.9",
        "@types/linkify-it": "^3.0.5",
        "@types/lodash-es": "^4.17.12",
        "@types/marked-terminal": "^6.1.1",
        "@types/prismjs": "^1.26.3",
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        "@types/react-window": "^1.8.8",
        "@types/react-window-infinite-loader": "^1.0.9",
        "@types/url-parse": "^1.4.11",
        "@types/use-sync-external-store": "^0.0.6",
        "@vitejs/plugin-react": "^4.2.0",
        autoprefixer: "^10.4.16",
        "eslint-config-prettier": "^9.0.0",
        "eslint-import-resolver-typescript": "^3.6.1",
        "eslint-plugin-import": "^2.29.0",
        "eslint-plugin-prettier": "^5.0.1",
        "eslint-plugin-react": "^7.33.2",
        "eslint-plugin-sonarjs": "^0.23.0",
        postcss: "^8.4.31",
        prettier: "^3.1.0",
        "prettier-plugin-tailwindcss": "^0.5.7",
        "tailwind-merge": "^2.0.0",
        tailwindcss: "^3.3.5",
        taze: "^0.12.2",
        typescript: "^5.3.2",
        vite: "^5.0.11",
        "vite-plugin-tauri": "^3.3.0"
      },
      optionalDependencies: {
        "@rollup/rollup-linux-x64-gnu": "4.14.1"
      }
    };
  }
});

// vite.config.mts
import fs2 from "fs";
import path3 from "path";
import react from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/packages/pastebar-app-ui/node_modules/vite/dist/node/index.js";
import * as dotenv from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/dotenv/lib/main.js";
import dynamicImport from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/vite-plugin-dynamic-import/dist/index.mjs";
import { viteStaticCopy } from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/packages/pastebar-app-ui/node_modules/vite-plugin-static-copy/dist/index.js";
import { pathToFileURL } from "url";

// src/lib/i18n-vite-loaded/loader.ts
import path2 from "node:path";
import { setProperty } from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/dot-prop/index.js";
import { marked } from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/marked/lib/marked.esm.js";
import TerminalRenderer from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/marked-terminal/index.js";
import { merge } from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/ts-deepmerge/esm/index.js";
import { createLogger } from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/packages/pastebar-app-ui/node_modules/vite/dist/node/index.js";

// src/lib/i18n-vite-loaded/utils.ts
import fs from "node:fs";
import path from "node:path";
import globAll from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/glob-all/glob-all.js";
import * as yaml from "file:///Users/kurdin/projects/pasteBar/PasteBarApp/node_modules/js-yaml/dist/js-yaml.mjs";
var virtualModuleId = "virtual:i18next-loader";
var resolvedVirtualModuleId = "\0" + virtualModuleId;
function jsNormalizedLang(lang) {
  return lang.replace(/-/, "_");
}
function enumerateLangs(dir) {
  return fs.readdirSync(dir).filter(function(file) {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}
function findAll(globs, cwd) {
  const globArray = Array.isArray(globs) ? globs : [globs];
  return globAll.sync(globArray, { cwd, realpath: true });
}
function resolvePaths(paths, cwd) {
  return paths.map((override) => {
    if (path.isAbsolute(override)) {
      return override;
    } else {
      return path.join(cwd, override);
    }
  });
}
function assertExistence(paths) {
  for (const dir of paths) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory does not exist: ${dir}`);
    }
  }
}
function loadAndParse(langFile) {
  const fileContent = String(fs.readFileSync(langFile));
  const extname = path.extname(langFile);
  let parsedContent;
  if (extname === ".yaml" || extname === ".yml") {
    parsedContent = yaml.load(fileContent);
  } else {
    parsedContent = JSON.parse(fileContent);
  }
  return parsedContent;
}

// src/lib/i18n-vite-loaded/loader.ts
marked.setOptions({
  // @ts-expect-error - marked-terminal is not typed well
  renderer: new TerminalRenderer()
});
var LogLevels = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3
};
var loadedFiles = [];
var allLangs = /* @__PURE__ */ new Set();
var factory = (options) => {
  const log = createLogger(options.logLevel || "warn", { prefix: "[i18next-loader]" });
  function loadLocales() {
    const localeDirs = resolvePaths(options.paths, process.cwd());
    assertExistence(localeDirs);
    let appResBundle = {};
    loadedFiles = [];
    log.info("Bundling locales (ordered least specific to most):", {
      timestamp: true
    });
    localeDirs.forEach((nextLocaleDir) => {
      const langs = enumerateLangs(nextLocaleDir);
      allLangs = /* @__PURE__ */ new Set([...allLangs, ...langs]);
      for (const lang of langs) {
        const resBundle = {};
        resBundle[lang] = {};
        const langDir = path2.join(nextLocaleDir, lang);
        const langFiles = findAll(
          options.include || ["**/*.json", "**/*.yml", "**/*.yaml"],
          langDir
        );
        for (const langFile of langFiles) {
          loadedFiles.push(langFile);
          log.info("	" + langFile, {
            timestamp: true
          });
          const content = loadAndParse(langFile);
          if (options.namespaceResolution) {
            let namespaceFilepath = langFile;
            if (options.namespaceResolution === "relativePath") {
              namespaceFilepath = path2.relative(path2.join(nextLocaleDir, lang), langFile);
            } else if (options.namespaceResolution === "basename") {
              namespaceFilepath = path2.basename(langFile);
            }
            const extname = path2.extname(langFile);
            const namespaceParts = namespaceFilepath.replace(extname, "").split(path2.sep);
            const namespace = [lang].concat(namespaceParts).join(".");
            setProperty(resBundle, namespace, content);
          } else {
            resBundle[lang] = content;
          }
          appResBundle = merge(appResBundle, resBundle);
        }
      }
    });
    let namedBundle = "";
    for (const lang of allLangs) {
      namedBundle += `export const ${jsNormalizedLang(lang)} = ${JSON.stringify(
        appResBundle[lang]
      )}
`;
    }
    let defaultExport = "const resources = { \n";
    for (const lang of allLangs) {
      defaultExport += `"${lang}": ${jsNormalizedLang(lang)},
`;
    }
    defaultExport += "}";
    defaultExport += "\nexport default resources\n";
    const bundle = namedBundle + defaultExport;
    log.info(`Locales module '${resolvedVirtualModuleId}':`, {
      timestamp: true
    });
    if (LogLevels[options.logLevel || "warn"] >= LogLevels["info"]) {
      console.log(
        marked(`
\`\`\`js
${bundle}
\`\`\`
`)
      );
    }
    return bundle;
  }
  const plugin = {
    name: "vite-plugin-i18next-loader",
    // required, will show up in warnings and errors
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) {
        return null;
      }
      const bundle = loadLocales();
      for (const file of loadedFiles) {
        this.addWatchFile(file);
      }
      return bundle;
    },
    /**
     * Watch translation message files and trigger an update.
     *
     * @see https://github.com/vitejs/vite/issues/6871 <- as is implemented now, with a full reload
     * @see https://github.com/vitejs/vite/pull/10333 <- TODO this is the one that would be easiest and may not be a full reload
     */
    handleHotUpdate({ file, server }) {
      if (loadedFiles.includes(file)) {
        log.info(`Changed locale file: ${file}`, {
          timestamp: true
        });
        const { moduleGraph, ws } = server;
        const module = moduleGraph.getModuleById(resolvedVirtualModuleId);
        if (module) {
          log.info(
            `Invalidated module '${resolvedVirtualModuleId}' - sending full reload`,
            {
              timestamp: true
            }
          );
          moduleGraph.invalidateModule(module);
          if (ws) {
            ws.send({
              type: "full-reload",
              path: "*"
            });
          }
        }
      }
    }
  };
  return plugin;
};
var loader_default = factory;

// vite.config.mts
var __vite_injected_original_dirname = "/Users/kurdin/projects/pasteBar/PasteBarApp/packages/pastebar-app-ui";
dotenv.config();
var ReactCompilerConfig = {
  runtimeModule: "react-compiler-runtime",
  target: "19"
  // '17' | '18' | '19'
};
var pastebarAppPackage;
var pastebarUIVersion = require_package().version;
async function loadPasteBarAppPackage() {
  try {
    const pastebarAppPath = process.env.PASTEBAR_APP_PATH || path3.resolve(__vite_injected_original_dirname, "../..");
    const packageJsonPath = path3.join(pastebarAppPath, "package.json");
    const packageJsonUrl = pathToFileURL(packageJsonPath).href;
    pastebarAppPackage = await import(packageJsonUrl, {
      with: { type: "json" }
    });
  } catch (e) {
    console.log("Please make sure main PasteBarApp repo exist");
    console.error("\nError reading package.json:", e);
    process.exit(1);
  }
}
var vite_config_default = async () => {
  await loadPasteBarAppPackage();
  console.log("PasteBar App Path:", process.env.PASTEBAR_APP_PATH);
  console.log("PasteBar App Version:", pastebarAppPackage.default.version);
  console.log("PasteBar UI Version:", pastebarUIVersion);
  console.log("");
  return defineConfig({
    clearScreen: false,
    server: {
      port: 4422,
      open: false,
      strictPort: true
    },
    define: {
      BUILD_DATE: JSON.stringify((/* @__PURE__ */ new Date()).valueOf()),
      APP_VERSION: JSON.stringify(pastebarAppPackage.default.version),
      APP_UI_VERSION: JSON.stringify(pastebarUIVersion)
    },
    envPrefix: [
      "VITE_",
      "TAURI_PLATFORM",
      "TAURI_ARCH",
      "TAURI_FAMILY",
      "TAURI_PLATFORM_VERSION",
      "TAURI_PLATFORM_TYPE",
      "TAURI_DEBUG"
    ],
    build: {
      outDir: path3.join(__vite_injected_original_dirname, "dist-ui"),
      emptyOutDir: true,
      commonjsOptions: { defaultIsModuleExports: "auto" },
      target: ["es2015", "safari11"],
      minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
      sourcemap: !!process.env.TAURI_DEBUG,
      rollupOptions: {
        input: {
          main: path3.resolve(__vite_injected_original_dirname, "index.html"),
          history: path3.resolve(__vite_injected_original_dirname, "history-index.html"),
          quickpaste: path3.resolve(__vite_injected_original_dirname, "quickpaste-index.html")
        }
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: []
      }
    },
    resolve: {
      alias: {
        "~": path3.join(__vite_injected_original_dirname, "src")
      }
    },
    plugins: [
      react({
        babel: {
          plugins: [
            "module:@preact/signals-react-transform",
            ["babel-plugin-react-compiler", ReactCompilerConfig]
          ]
        }
      }),
      dynamicImport(),
      loader_default({
        paths: ["./src/locales/lang"],
        namespaceResolution: "basename"
      }),
      viteStaticCopy({
        targets: [
          {
            src: "drop-*",
            dest: "."
          }
        ]
      }),
      {
        name: "build-script",
        closeBundle() {
          const packageJson = require_package();
          const version = packageJson.version;
          fs2.mkdir(path3.join(__vite_injected_original_dirname, "dist-ui"), { recursive: false }, () => {
            const versionFile = path3.join(__vite_injected_original_dirname, "dist-ui", `ui.version.${version}`);
            fs2.writeFileSync(versionFile, version);
            const stylesSrc = path3.join(__vite_injected_original_dirname, "assets/styles");
            const stylesDest = path3.join(__vite_injected_original_dirname, "dist-ui/assets/styles");
            fs2.cpSync(stylesSrc, stylesDest, { recursive: true });
            const wasmSrc = path3.join(__vite_injected_original_dirname, "assets/markdown");
            const wasmDest = path3.join(__vite_injected_original_dirname, "dist-ui/assets/markdown");
            fs2.cpSync(wasmSrc, wasmDest, { recursive: true });
          });
        }
      }
    ]
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZS5qc29uIiwgInZpdGUuY29uZmlnLm10cyIsICJzcmMvbGliL2kxOG4tdml0ZS1sb2FkZWQvbG9hZGVyLnRzIiwgInNyYy9saWIvaTE4bi12aXRlLWxvYWRlZC91dGlscy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1xuICBcIm5hbWVcIjogXCJwYXN0ZWJhci1hcHAtdWlcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMC42LjJcIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXG4gICAgXCJzdGFydFwiOiBcIm5wbSBydW4gZGV2XCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcImJ1aWxkOnRzXCI6IFwidHNjICYmIHZpdGUgYnVpbGRcIixcbiAgICBcImZvcm1hdFwiOiBcIm5weCBwcmV0dGllciAtLXdyaXRlIC4gLS1pZ25vcmUtcGF0aCAuZ2l0aWdub3JlIFwiLFxuICAgIFwidGF6ZVwiOiBcInRhemUgbWFqb3IgLUlcIixcbiAgICBcInRhemU6bWlub3JcIjogXCJ0YXplIG1pbm9yIC13XCIsXG4gICAgXCJwcmV2aWV3XCI6IFwidml0ZSBwcmV2aWV3XCIsXG4gICAgXCJhdWRpdDpwcm9kXCI6IFwibnBtIGF1ZGl0IC0tb21pdD1kZXZcIlxuICB9LFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAY29kYXN0aWMvcmVhY3QtcG9zaXRpb25pbmctcG9ydGFsXCI6IFwiXjAuNy4wXCIsXG4gICAgXCJAZG5kLWtpdC9jb3JlXCI6IFwiXjYuMS4wXCIsXG4gICAgXCJAZG5kLWtpdC9tb2RpZmllcnNcIjogXCJeNy4wLjBcIixcbiAgICBcIkBkbmQta2l0L3NvcnRhYmxlXCI6IFwiXjguMC4wXCIsXG4gICAgXCJAZW1vdGlvbi9jc3NcIjogXCJeMTEuMTEuMlwiLFxuICAgIFwiQGlhbnZzL3ByZXR0aWVyLXBsdWdpbi1zb3J0LWltcG9ydHNcIjogXCJeNC4xLjFcIixcbiAgICBcIkBwcmVhY3Qvc2lnbmFscy1yZWFjdFwiOiBcIl4yLjAuMVwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFjY2Vzc2libGUtaWNvblwiOiBcIl4xLjAuM1wiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFjY29yZGlvblwiOiBcIl4xLjEuMlwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFsZXJ0LWRpYWxvZ1wiOiBcIl4xLjAuNVwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFzcGVjdC1yYXRpb1wiOiBcIl4xLjAuM1wiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWF2YXRhclwiOiBcIl4xLjAuNFwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94XCI6IFwiXjEuMC40XCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtY29sbGFwc2libGVcIjogXCJeMS4wLjNcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1jb250ZXh0LW1lbnVcIjogXCJeMi4xLjVcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIjogXCJeMS4wLjVcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51XCI6IFwiXjIuMC42XCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtaG92ZXItY2FyZFwiOiBcIl4xLjAuN1wiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWxhYmVsXCI6IFwiXjIuMC4yXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtbWVudWJhclwiOiBcIl4xLjAuNFwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LW5hdmlnYXRpb24tbWVudVwiOiBcIl4xLjEuNFwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXJcIjogXCJeMS4wLjdcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1wcm9ncmVzc1wiOiBcIl4xLjAuM1wiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LXJhZGlvLWdyb3VwXCI6IFwiXjEuMS4zXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2Nyb2xsLWFyZWFcIjogXCJeMS4wLjVcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIjogXCJeMi4wLjBcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1zZXBhcmF0b3JcIjogXCJeMS4wLjNcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1zbGlkZXJcIjogXCJeMS4xLjJcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1zbG90XCI6IFwiXjEuMC4yXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3Qtc3dpdGNoXCI6IFwiXjEuMC4zXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiOiBcIl4xLjAuNFwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvYXN0XCI6IFwiXjEuMS41XCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9nZ2xlXCI6IFwiXjEuMC4zXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9nZ2xlLWdyb3VwXCI6IFwiXjEuMC40XCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcFwiOiBcIl4xLjAuN1wiLFxuICAgIFwiQHJlYWN0LWFyaWEvaTE4blwiOiBcIl4zLjkuMFwiLFxuICAgIFwiQHJlYWN0LWFyaWEvdXRpbHNcIjogXCJeMy4yMi4wXCIsXG4gICAgXCJAcmVhY3Qtc3RhdGVseS91dGlsc1wiOiBcIl4zLjkuMFwiLFxuICAgIFwiQHJvbGx1cC9wbHVnaW4tY29tbW9uanNcIjogXCJeMjUuMC43XCIsXG4gICAgXCJAc3Znci93ZWJwYWNrXCI6IFwiXjguMS4wXCIsXG4gICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIjogXCI1LjI1LjBcIixcbiAgICBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeS1kZXZ0b29sc1wiOiBcIjUuMjUuMFwiLFxuICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5LXBlcnNpc3QtY2xpZW50XCI6IFwiNS4yNS4wXCIsXG4gICAgXCJAdGF1cmktYXBwcy9hcGlcIjogXCJeMS41LjNcIixcbiAgICBcIkB0eXBlcy9ub2RlXCI6IFwiXjIwLjEwLjBcIixcbiAgICBcIkB1aXcvY29kZW1pcnJvci1leHRlbnNpb25zLWxhbmdzXCI6IFwiXjQuMjEuMjFcIixcbiAgICBcIkB1aXcvY29kZW1pcnJvci10aGVtZS1naXRodWJcIjogXCJeNC4yMS4yMVwiLFxuICAgIFwiQHVpdy9jb2RlbWlycm9yLXRoZW1lLXZzY29kZVwiOiBcIl40LjIxLjIxXCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjogXCJeMy41LjBcIixcbiAgICBcImJhYmVsLXBsdWdpbi1yZWFjdC1jb21waWxlclwiOiBcIl4wLjAuMC1leHBlcmltZW50YWwtNjk2YWY1My0yMDI0MDYyNVwiLFxuICAgIFwiY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5XCI6IFwiXjAuNy4wXCIsXG4gICAgXCJjbGFzc25hbWVzXCI6IFwiXjIuNS4xXCIsXG4gICAgXCJjbHN4XCI6IFwiXjIuMC4wXCIsXG4gICAgXCJjbWRrXCI6IFwiXjAuMi4wXCIsXG4gICAgXCJjb2RlbWlycm9yXCI6IFwiXjUuNjUuMTZcIixcbiAgICBcImRhdGUtZm5zXCI6IFwiXjIuMzAuMFwiLFxuICAgIFwiZGF5anNcIjogXCJeMS4xMS4xMFwiLFxuICAgIFwiZG9tcHVyaWZ5XCI6IFwiXjMuMS4zXCIsXG4gICAgXCJkb3QtcHJvcFwiOiBcIl44LjAuMlwiLFxuICAgIFwiZG90ZW52XCI6IFwiXjE2LjQuNVwiLFxuICAgIFwiZW1lcnlcIjogXCJeMS40LjJcIixcbiAgICBcImVtb2ppLXBpY2tlci1yZWFjdFwiOiBcIl40LjUuMTZcIixcbiAgICBcImVzbGludC1wbHVnaW4tcmVhY3QtY29tcGlsZXJcIjogXCJeMC4wLjAtZXhwZXJpbWVudGFsLTUxYTg1ZWEtMjAyNDA2MDFcIixcbiAgICBcImV2ZW50c1wiOiBcIl4zLjMuMFwiLFxuICAgIFwiZmFjZXBhaW50XCI6IFwiXjEuMi4xXCIsXG4gICAgXCJmcmFtZXItbW90aW9uXCI6IFwiXjEwLjE2LjVcIixcbiAgICBcImdhcmJhZG9zLWNyeXB0XCI6IFwiXjMuMC4wLWJldGFcIixcbiAgICBcImdsb2ItYWxsXCI6IFwiXjMuMy4xXCIsXG4gICAgXCJpMThuZXh0XCI6IFwiXjIzLjEwLjBcIixcbiAgICBcImkxOG5leHQtYnJvd3Nlci1sYW5ndWFnZWRldGVjdG9yXCI6IFwiXjcuMi4wXCIsXG4gICAgXCJpZGIta2V5dmFsXCI6IFwiXjYuMi4xXCIsXG4gICAgXCJqYXZhc2NyaXB0LXRpbWUtYWdvXCI6IFwiXjIuNS45XCIsXG4gICAgXCJqb3RhaVwiOiBcIl4yLjYuMFwiLFxuICAgIFwiam90YWktenVzdGFuZFwiOiBcIl4wLjMuMFwiLFxuICAgIFwianMteWFtbFwiOiBcIl40LjEuMFwiLFxuICAgIFwibGlua2lmeS1pdFwiOiBcIl41LjAuMFwiLFxuICAgIFwibG9kYXNoLWVzXCI6IFwiXjQuMTcuMjFcIixcbiAgICBcImx1Y2lkZS1yZWFjdFwiOiBcIjAuMzYzLjBcIixcbiAgICBcIm1hcmtkb3duLXdhc21cIjogXCJeMS4yLjBcIixcbiAgICBcIm1hcmtlZFwiOiBcIl4xMi4wLjBcIixcbiAgICBcIm1hcmtlZC10ZXJtaW5hbFwiOiBcIl43LjAuMFwiLFxuICAgIFwibmV4dC10aGVtZXNcIjogXCJeMC4yLjFcIixcbiAgICBcIm92ZXJsYXlzY3JvbGxiYXJzXCI6IFwiXjIuNC41XCIsXG4gICAgXCJvdmVybGF5c2Nyb2xsYmFycy1yZWFjdFwiOiBcIl4wLjUuM1wiLFxuICAgIFwicHJpc20tcmVhY3QtcmVuZGVyZXJcIjogXCJeMi4zLjFcIixcbiAgICBcInByaXNtanNcIjogXCJeMS4yOS4wXCIsXG4gICAgXCJyZWFjdFwiOiBcIl4xOC4zLjFcIixcbiAgICBcInJlYWN0LWNhbnZhcy1jb25mZXR0aVwiOiBcIl4yLjAuN1wiLFxuICAgIFwicmVhY3QtY29tcGlsZXItcnVudGltZVwiOiBcImZpbGU6Li9zY3JpcHRzL3JlYWN0LWNvbXBpbGVyLXJ1bnRpbWVcIixcbiAgICBcInJlYWN0LWNvbXBsZXgtdHJlZVwiOiBcIl4yLjIuM1wiLFxuICAgIFwicmVhY3QtZGF5LXBpY2tlclwiOiBcIl44LjkuMVwiLFxuICAgIFwicmVhY3QtZG5kXCI6IFwiXjE2LjAuMVwiLFxuICAgIFwicmVhY3QtZG5kLWh0bWw1LWJhY2tlbmRcIjogXCJeMTYuMC4xXCIsXG4gICAgXCJyZWFjdC1kb21cIjogXCJeMTguMy4xXCIsXG4gICAgXCJyZWFjdC1lcnJvci1ib3VuZGFyeVwiOiBcIl40LjAuMTNcIixcbiAgICBcInJlYWN0LWhvdGtleXMtaG9va1wiOiBcIl40LjQuMVwiLFxuICAgIFwicmVhY3QtaHRtbC1wcm9wc1wiOiBcIl4yLjAuOVwiLFxuICAgIFwicmVhY3QtaTE4bmV4dFwiOiBcIl4xNC4wLjVcIixcbiAgICBcInJlYWN0LXJvdXRlci1kb21cIjogXCJeNi4yMC4wXCIsXG4gICAgXCJyZWFjdC1zdWItdW5zdWJcIjogXCJeMi4yLjdcIixcbiAgICBcInJlYWN0LXRleHRhcmVhLWF1dG9zaXplXCI6IFwiXjguNS4zXCIsXG4gICAgXCJyZWFjdC10aW1lLWFnb1wiOiBcIl43LjIuMVwiLFxuICAgIFwicmVhY3QtdHdpdHRlci1lbWJlZFwiOiBcIl40LjAuNFwiLFxuICAgIFwicmVhY3QtdXNlLWhvdmVyaW50ZW50XCI6IFwiXjEuMy4wXCIsXG4gICAgXCJyZWFjdC12aXJ0dWFsaXplZC1hdXRvLXNpemVyXCI6IFwiXjEuMC4yMFwiLFxuICAgIFwicmVhY3QtdmlydHVvc29cIjogXCJeNC42LjJcIixcbiAgICBcInJlYWN0LXdpbmRvd1wiOiBcIl4xLjguMTBcIixcbiAgICBcInJlYWN0LXdpbmRvdy1pbmZpbml0ZS1sb2FkZXJcIjogXCJeMS4wLjlcIixcbiAgICBcInJlY2hhcnRzXCI6IFwiXjIuMTAuMVwiLFxuICAgIFwicmVzaXplLW9ic2VydmVyLXBvbHlmaWxsXCI6IFwiXjEuNS4xXCIsXG4gICAgXCJyaW1yYWZcIjogXCJeNS4wLjVcIixcbiAgICBcInJvbGx1cFwiOiBcIl40LjEwLjBcIixcbiAgICBcInNjcmlwdGpzXCI6IFwiXjIuNS45XCIsXG4gICAgXCJzaG9ydC11bmlxdWUtaWRcIjogXCJeNS4wLjNcIixcbiAgICBcInRhaWx3aW5kLXNjcm9sbGJhclwiOiBcIl4zLjAuNVwiLFxuICAgIFwidGFpbHdpbmRjc3MtYW5pbWF0ZVwiOiBcIl4xLjAuN1wiLFxuICAgIFwidGF1cmktcGx1Z2luLWNsaXBib2FyZC1hcGlcIjogXCJeMC41LjVcIixcbiAgICBcInRhdXJpLXBsdWdpbi1sb2ctYXBpXCI6IFwiZ2l0aHViOnRhdXJpLWFwcHMvdGF1cmktcGx1Z2luLWxvZ1wiLFxuICAgIFwidGF1cmktcGx1Z2luLXBvc2l0aW9uZXItYXBpXCI6IFwiZ2l0aHViOnRhdXJpLWFwcHMvdGF1cmktcGx1Z2luLXBvc2l0aW9uZXJcIixcbiAgICBcInRzLWRlZXBtZXJnZVwiOiBcIl43LjAuMFwiLFxuICAgIFwidXJsLXBhcnNlXCI6IFwiXjEuNS4xMFwiLFxuICAgIFwidXNlLXJlc2l6ZS1vYnNlcnZlclwiOiBcIl45LjEuMFwiLFxuICAgIFwidml0ZS1wbHVnaW4tYmFiZWxcIjogXCJeMS4yLjBcIixcbiAgICBcInZpdGUtcGx1Z2luLWR5bmFtaWMtaW1wb3J0XCI6IFwiXjEuNS4wXCIsXG4gICAgXCJ2aXRlLXBsdWdpbi1zdGF0aWMtY29weVwiOiBcIl4xLjAuMlwiLFxuICAgIFwiem9kXCI6IFwiXjMuMjIuMlwiLFxuICAgIFwienVzdGFuZFwiOiBcIl40LjQuNlwiLFxuICAgIFwienVzdGFuZC1sb2dnZXItbWlkZGxld2FyZVwiOiBcIl4xLjAuOVwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBjaGFuZ2VzZXRzL2NsaVwiOiBcIl4yLjI3LjFcIixcbiAgICBcIkBwcmVhY3Qvc2lnbmFscy1yZWFjdC10cmFuc2Zvcm1cIjogXCJeMC4zLjFcIixcbiAgICBcIkB0YWlsd2luZGNzcy9saW5lLWNsYW1wXCI6IFwiXjAuNC40XCIsXG4gICAgXCJAdGF1cmktYXBwcy9jbGlcIjogXCJeMS41LjZcIixcbiAgICBcIkB0cml2YWdvL3ByZXR0aWVyLXBsdWdpbi1zb3J0LWltcG9ydHNcIjogXCJeNC4zLjBcIixcbiAgICBcIkB0eXBlcy9iY3J5cHRqc1wiOiBcIl4yLjQuNlwiLFxuICAgIFwiQHR5cGVzL2NvZGVtaXJyb3JcIjogXCJeNS42MC4xNVwiLFxuICAgIFwiQHR5cGVzL2RvbXB1cmlmeVwiOiBcIl4zLjAuNVwiLFxuICAgIFwiQHR5cGVzL2V2ZW50c1wiOiBcIl4zLjAuM1wiLFxuICAgIFwiQHR5cGVzL2pzLXlhbWxcIjogXCJeNC4wLjlcIixcbiAgICBcIkB0eXBlcy9saW5raWZ5LWl0XCI6IFwiXjMuMC41XCIsXG4gICAgXCJAdHlwZXMvbG9kYXNoLWVzXCI6IFwiXjQuMTcuMTJcIixcbiAgICBcIkB0eXBlcy9tYXJrZWQtdGVybWluYWxcIjogXCJeNi4xLjFcIixcbiAgICBcIkB0eXBlcy9wcmlzbWpzXCI6IFwiXjEuMjYuM1wiLFxuICAgIFwiQHR5cGVzL3JlYWN0XCI6IFwiXjE4LjMuM1wiLFxuICAgIFwiQHR5cGVzL3JlYWN0LWRvbVwiOiBcIl4xOC4zLjBcIixcbiAgICBcIkB0eXBlcy9yZWFjdC13aW5kb3dcIjogXCJeMS44LjhcIixcbiAgICBcIkB0eXBlcy9yZWFjdC13aW5kb3ctaW5maW5pdGUtbG9hZGVyXCI6IFwiXjEuMC45XCIsXG4gICAgXCJAdHlwZXMvdXJsLXBhcnNlXCI6IFwiXjEuNC4xMVwiLFxuICAgIFwiQHR5cGVzL3VzZS1zeW5jLWV4dGVybmFsLXN0b3JlXCI6IFwiXjAuMC42XCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiOiBcIl40LjIuMFwiLFxuICAgIFwiYXV0b3ByZWZpeGVyXCI6IFwiXjEwLjQuMTZcIixcbiAgICBcImVzbGludC1jb25maWctcHJldHRpZXJcIjogXCJeOS4wLjBcIixcbiAgICBcImVzbGludC1pbXBvcnQtcmVzb2x2ZXItdHlwZXNjcmlwdFwiOiBcIl4zLjYuMVwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1pbXBvcnRcIjogXCJeMi4yOS4wXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXByZXR0aWVyXCI6IFwiXjUuMC4xXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXJlYWN0XCI6IFwiXjcuMzMuMlwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1zb25hcmpzXCI6IFwiXjAuMjMuMFwiLFxuICAgIFwicG9zdGNzc1wiOiBcIl44LjQuMzFcIixcbiAgICBcInByZXR0aWVyXCI6IFwiXjMuMS4wXCIsXG4gICAgXCJwcmV0dGllci1wbHVnaW4tdGFpbHdpbmRjc3NcIjogXCJeMC41LjdcIixcbiAgICBcInRhaWx3aW5kLW1lcmdlXCI6IFwiXjIuMC4wXCIsXG4gICAgXCJ0YWlsd2luZGNzc1wiOiBcIl4zLjMuNVwiLFxuICAgIFwidGF6ZVwiOiBcIl4wLjEyLjJcIixcbiAgICBcInR5cGVzY3JpcHRcIjogXCJeNS4zLjJcIixcbiAgICBcInZpdGVcIjogXCJeNS4wLjExXCIsXG4gICAgXCJ2aXRlLXBsdWdpbi10YXVyaVwiOiBcIl4zLjMuMFwiXG4gIH0sXG4gIFwib3B0aW9uYWxEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQHJvbGx1cC9yb2xsdXAtbGludXgteDY0LWdudVwiOiBcIjQuMTQuMVwiXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2t1cmRpbi9wcm9qZWN0cy9wYXN0ZUJhci9QYXN0ZUJhckFwcC9wYWNrYWdlcy9wYXN0ZWJhci1hcHAtdWlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9rdXJkaW4vcHJvamVjdHMvcGFzdGVCYXIvUGFzdGVCYXJBcHAvcGFja2FnZXMvcGFzdGViYXItYXBwLXVpL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMva3VyZGluL3Byb2plY3RzL3Bhc3RlQmFyL1Bhc3RlQmFyQXBwL3BhY2thZ2VzL3Bhc3RlYmFyLWFwcC11aS92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJ1xuaW1wb3J0ICogYXMgZG90ZW52IGZyb20gJ2RvdGVudidcbmltcG9ydCBkeW5hbWljSW1wb3J0IGZyb20gJ3ZpdGUtcGx1Z2luLWR5bmFtaWMtaW1wb3J0J1xuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tICd2aXRlLXBsdWdpbi1zdGF0aWMtY29weSdcbmltcG9ydCB7IHBhdGhUb0ZpbGVVUkwgfSBmcm9tICd1cmwnO1xuXG5pbXBvcnQgaTE4bmV4dExvYWRlciBmcm9tICcuL3NyYy9saWIvaTE4bi12aXRlLWxvYWRlZC9sb2FkZXInXG5cbmRvdGVudi5jb25maWcoKVxuXG5jb25zdCBSZWFjdENvbXBpbGVyQ29uZmlnID0ge1xuICBydW50aW1lTW9kdWxlOiAncmVhY3QtY29tcGlsZXItcnVudGltZScsXG4gIHRhcmdldDogJzE5JywgLy8gJzE3JyB8ICcxOCcgfCAnMTknXG59XG5cbmxldCBwYXN0ZWJhckFwcFBhY2thZ2VcbmNvbnN0IHBhc3RlYmFyVUlWZXJzaW9uID0gcmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uXG5cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFBhc3RlQmFyQXBwUGFja2FnZSgpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXN0ZWJhckFwcFBhdGggPSBwcm9jZXNzLmVudi5QQVNURUJBUl9BUFBfUEFUSCB8fCBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4nKTtcbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBwYXRoLmpvaW4ocGFzdGViYXJBcHBQYXRoLCAncGFja2FnZS5qc29uJyk7XG4gICAgY29uc3QgcGFja2FnZUpzb25VcmwgPSBwYXRoVG9GaWxlVVJMKHBhY2thZ2VKc29uUGF0aCkuaHJlZjtcblxuICAgIHBhc3RlYmFyQXBwUGFja2FnZSA9IGF3YWl0IGltcG9ydChwYWNrYWdlSnNvblVybCwge1xuICAgICAgd2l0aDogeyB0eXBlOiAnanNvbicgfVxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmxvZygnUGxlYXNlIG1ha2Ugc3VyZSBtYWluIFBhc3RlQmFyQXBwIHJlcG8gZXhpc3QnKVxuICAgIGNvbnNvbGUuZXJyb3IoJ1xcbkVycm9yIHJlYWRpbmcgcGFja2FnZS5qc29uOicsIGUpXG4gICAgcHJvY2Vzcy5leGl0KDEpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKCkgPT4ge1xuICBhd2FpdCBsb2FkUGFzdGVCYXJBcHBQYWNrYWdlKClcblxuICBjb25zb2xlLmxvZygnUGFzdGVCYXIgQXBwIFBhdGg6JywgcHJvY2Vzcy5lbnYuUEFTVEVCQVJfQVBQX1BBVEgpXG4gIGNvbnNvbGUubG9nKCdQYXN0ZUJhciBBcHAgVmVyc2lvbjonLCBwYXN0ZWJhckFwcFBhY2thZ2UuZGVmYXVsdC52ZXJzaW9uKVxuICBjb25zb2xlLmxvZygnUGFzdGVCYXIgVUkgVmVyc2lvbjonLCBwYXN0ZWJhclVJVmVyc2lvbilcbiAgY29uc29sZS5sb2coJycpXG5cbiAgcmV0dXJuIGRlZmluZUNvbmZpZyh7XG4gICAgY2xlYXJTY3JlZW46IGZhbHNlLFxuICAgICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiA0NDIyLFxuICAgICAgb3BlbjogZmFsc2UsXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIH0sXG4gICAgZGVmaW5lOiB7XG4gICAgICBCVUlMRF9EQVRFOiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpLnZhbHVlT2YoKSksXG4gICAgICBBUFBfVkVSU0lPTjogSlNPTi5zdHJpbmdpZnkocGFzdGViYXJBcHBQYWNrYWdlLmRlZmF1bHQudmVyc2lvbiksXG4gICAgICBBUFBfVUlfVkVSU0lPTjogSlNPTi5zdHJpbmdpZnkocGFzdGViYXJVSVZlcnNpb24pLFxuICAgIH0sXG4gICAgZW52UHJlZml4OiBbXG4gICAgICAnVklURV8nLFxuICAgICAgJ1RBVVJJX1BMQVRGT1JNJyxcbiAgICAgICdUQVVSSV9BUkNIJyxcbiAgICAgICdUQVVSSV9GQU1JTFknLFxuICAgICAgJ1RBVVJJX1BMQVRGT1JNX1ZFUlNJT04nLFxuICAgICAgJ1RBVVJJX1BMQVRGT1JNX1RZUEUnLFxuICAgICAgJ1RBVVJJX0RFQlVHJyxcbiAgICBdLFxuXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogcGF0aC5qb2luKF9fZGlybmFtZSwgJ2Rpc3QtdWknKSxcbiAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgY29tbW9uanNPcHRpb25zOiB7IGRlZmF1bHRJc01vZHVsZUV4cG9ydHM6ICdhdXRvJyB9LFxuICAgICAgdGFyZ2V0OiBbJ2VzMjAxNScsICdzYWZhcmkxMSddLFxuICAgICAgbWluaWZ5OiAhcHJvY2Vzcy5lbnYuVEFVUklfREVCVUcgPyAnZXNidWlsZCcgOiBmYWxzZSxcbiAgICAgIHNvdXJjZW1hcDogISFwcm9jZXNzLmVudi5UQVVSSV9ERUJVRyxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgaW5wdXQ6IHtcbiAgICAgICAgICBtYWluOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpLFxuICAgICAgICAgIGhpc3Rvcnk6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdoaXN0b3J5LWluZGV4Lmh0bWwnKSxcbiAgICAgICAgICBxdWlja3Bhc3RlOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAncXVpY2twYXN0ZS1pbmRleC5odG1sJyksXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgICBwbHVnaW5zOiBbXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnfic6IHBhdGguam9pbihfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIGJhYmVsOiB7XG4gICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgXCJtb2R1bGU6QHByZWFjdC9zaWduYWxzLXJlYWN0LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgW1wiYmFiZWwtcGx1Z2luLXJlYWN0LWNvbXBpbGVyXCIsIFJlYWN0Q29tcGlsZXJDb25maWddLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSBhcyBQbHVnaW5PcHRpb24sXG4gICAgICBkeW5hbWljSW1wb3J0KCkgYXMgYW55LFxuICAgICAgaTE4bmV4dExvYWRlcih7XG4gICAgICAgIHBhdGhzOiBbJy4vc3JjL2xvY2FsZXMvbGFuZyddLFxuICAgICAgICBuYW1lc3BhY2VSZXNvbHV0aW9uOiAnYmFzZW5hbWUnLFxuICAgICAgfSkgYXMgUGx1Z2luT3B0aW9uLFxuICAgICAgdml0ZVN0YXRpY0NvcHkoe1xuICAgICAgICB0YXJnZXRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnZHJvcC0qJyxcbiAgICAgICAgICAgIGRlc3Q6ICcuJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdidWlsZC1zY3JpcHQnLFxuICAgICAgICBjbG9zZUJ1bmRsZSgpIHtcbiAgICAgICAgICBjb25zdCBwYWNrYWdlSnNvbiA9IHJlcXVpcmUoJy4vcGFja2FnZS5qc29uJylcbiAgICAgICAgICBjb25zdCB2ZXJzaW9uID0gcGFja2FnZUpzb24udmVyc2lvblxuICAgICAgICAgIGZzLm1rZGlyKHBhdGguam9pbihfX2Rpcm5hbWUsICdkaXN0LXVpJyksIHsgcmVjdXJzaXZlOiBmYWxzZSB9LCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2ZXJzaW9uRmlsZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdkaXN0LXVpJywgYHVpLnZlcnNpb24uJHt2ZXJzaW9ufWApXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHZlcnNpb25GaWxlLCB2ZXJzaW9uKVxuICAgICAgICAgICAgY29uc3Qgc3R5bGVzU3JjID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2Fzc2V0cy9zdHlsZXMnKVxuICAgICAgICAgICAgY29uc3Qgc3R5bGVzRGVzdCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdkaXN0LXVpL2Fzc2V0cy9zdHlsZXMnKVxuICAgICAgICAgICAgZnMuY3BTeW5jKHN0eWxlc1NyYywgc3R5bGVzRGVzdCwge3JlY3Vyc2l2ZTogdHJ1ZX0pO1xuICAgICAgICAgICAgY29uc3Qgd2FzbVNyYyA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdhc3NldHMvbWFya2Rvd24nKVxuICAgICAgICAgICAgY29uc3Qgd2FzbURlc3QgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZGlzdC11aS9hc3NldHMvbWFya2Rvd24nKVxuICAgICAgICAgICAgZnMuY3BTeW5jKHdhc21TcmMsIHdhc21EZXN0LCB7cmVjdXJzaXZlOiB0cnVlfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSlcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2t1cmRpbi9wcm9qZWN0cy9wYXN0ZUJhci9QYXN0ZUJhckFwcC9wYWNrYWdlcy9wYXN0ZWJhci1hcHAtdWkvc3JjL2xpYi9pMThuLXZpdGUtbG9hZGVkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMva3VyZGluL3Byb2plY3RzL3Bhc3RlQmFyL1Bhc3RlQmFyQXBwL3BhY2thZ2VzL3Bhc3RlYmFyLWFwcC11aS9zcmMvbGliL2kxOG4tdml0ZS1sb2FkZWQvbG9hZGVyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9rdXJkaW4vcHJvamVjdHMvcGFzdGVCYXIvUGFzdGVCYXJBcHAvcGFja2FnZXMvcGFzdGViYXItYXBwLXVpL3NyYy9saWIvaTE4bi12aXRlLWxvYWRlZC9sb2FkZXIudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnXG5pbXBvcnQgeyBzZXRQcm9wZXJ0eSB9IGZyb20gJ2RvdC1wcm9wJ1xuaW1wb3J0IHsgbWFya2VkIH0gZnJvbSAnbWFya2VkJ1xuaW1wb3J0IFRlcm1pbmFsUmVuZGVyZXIgZnJvbSAnbWFya2VkLXRlcm1pbmFsJ1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tICd0cy1kZWVwbWVyZ2UnXG5pbXBvcnQgeyBjcmVhdGVMb2dnZXIsIExvZ0xldmVsLCBQbHVnaW4gfSBmcm9tICd2aXRlJ1xuXG5pbXBvcnQge1xuICBhc3NlcnRFeGlzdGVuY2UsXG4gIGVudW1lcmF0ZUxhbmdzLFxuICBmaW5kQWxsLFxuICBqc05vcm1hbGl6ZWRMYW5nLFxuICBsb2FkQW5kUGFyc2UsXG4gIHJlc29sdmVkVmlydHVhbE1vZHVsZUlkLFxuICByZXNvbHZlUGF0aHMsXG4gIHZpcnR1YWxNb2R1bGVJZCxcbn0gZnJvbSAnLi91dGlscydcblxubWFya2VkLnNldE9wdGlvbnMoe1xuICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gbWFya2VkLXRlcm1pbmFsIGlzIG5vdCB0eXBlZCB3ZWxsXG4gIHJlbmRlcmVyOiBuZXcgVGVybWluYWxSZW5kZXJlcigpLFxufSlcblxuLy8gdW5mb3J0dW5hdGVseSBub3QgZXhwb3J0ZWRcbmV4cG9ydCBjb25zdCBMb2dMZXZlbHM6IFJlY29yZDxMb2dMZXZlbCwgbnVtYmVyPiA9IHtcbiAgc2lsZW50OiAwLFxuICBlcnJvcjogMSxcbiAgd2FybjogMixcbiAgaW5mbzogMyxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqXG4gICAqIFNldCB0byAnaW5mbycgZm9yIG5vaXN5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBEZWZhdWx0OiAnd2FybidcbiAgICovXG4gIGxvZ0xldmVsPzogTG9nTGV2ZWxcblxuICAvKipcbiAgICogR2xvYiBwYXR0ZXJucyB0byBtYXRjaCBmaWxlc1xuICAgKlxuICAgKiBEZWZhdWx0OiBbJyoqXFwvKi5qc29uJywgJyoqXFwvKi55bWwnLCAnKipcXC8qLnlhbWwnXVxuICAgKi9cbiAgaW5jbHVkZT86IHN0cmluZ1tdXG5cbiAgLyoqXG4gICAqIExvY2FsZSB0b3AgbGV2ZWwgZGlyZWN0b3J5IHBhdGhzIG9yZGVyZWQgZnJvbSBsZWFzdCBzcGVjaWFsaXplZCB0byBtb3N0IHNwZWNpYWxpemVkXG4gICAqICBlLmcuIGxpYiBsb2NhbGUgLT4gYXBwIGxvY2FsZVxuICAgKlxuICAgKiBMb2NhbGVzIGxvYWRlZCBsYXRlciB3aWxsIG92ZXJ3cml0ZSBhbnkgZHVwbGljYXRlZCBrZXkgdmlhIGEgZGVlcCBtZXJnZSBzdHJhdGVneS5cbiAgICovXG4gIHBhdGhzOiBzdHJpbmdbXVxuXG4gIC8qKlxuICAgKiBEZWZhdWx0OiBub25lXG4gICAqL1xuICBuYW1lc3BhY2VSZXNvbHV0aW9uPzogJ2Jhc2VuYW1lJyB8ICdyZWxhdGl2ZVBhdGgnXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzQnVuZGxlIHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nIHwgb2JqZWN0XG59XG5cbi8vIGZvciBmYXN0IG1hdGNoIG9uIGhvdCByZWxvYWRpbmcgY2hlY2s/XG5sZXQgbG9hZGVkRmlsZXM6IHN0cmluZ1tdID0gW11cbmxldCBhbGxMYW5nczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KClcblxuY29uc3QgZmFjdG9yeSA9IChvcHRpb25zOiBPcHRpb25zKSA9PiB7XG4gIGNvbnN0IGxvZyA9IGNyZWF0ZUxvZ2dlcihvcHRpb25zLmxvZ0xldmVsIHx8ICd3YXJuJywgeyBwcmVmaXg6ICdbaTE4bmV4dC1sb2FkZXJdJyB9KVxuXG4gIGZ1bmN0aW9uIGxvYWRMb2NhbGVzKCkge1xuICAgIGNvbnN0IGxvY2FsZURpcnMgPSByZXNvbHZlUGF0aHMob3B0aW9ucy5wYXRocywgcHJvY2Vzcy5jd2QoKSlcbiAgICBhc3NlcnRFeGlzdGVuY2UobG9jYWxlRGlycylcblxuICAgIC8vXG4gICAgbGV0IGFwcFJlc0J1bmRsZTogUmVzQnVuZGxlID0ge31cbiAgICBsb2FkZWRGaWxlcyA9IFtdIC8vIHJlc2V0XG4gICAgbG9nLmluZm8oJ0J1bmRsaW5nIGxvY2FsZXMgKG9yZGVyZWQgbGVhc3Qgc3BlY2lmaWMgdG8gbW9zdCk6Jywge1xuICAgICAgdGltZXN0YW1wOiB0cnVlLFxuICAgIH0pXG4gICAgbG9jYWxlRGlycy5mb3JFYWNoKG5leHRMb2NhbGVEaXIgPT4ge1xuICAgICAgLy8gYWxsIHN1YmRpcmVjdG9yaWVzIG1hdGNoIGxhbmd1YWdlIGNvZGVzXG4gICAgICBjb25zdCBsYW5ncyA9IGVudW1lcmF0ZUxhbmdzKG5leHRMb2NhbGVEaXIpXG4gICAgICBhbGxMYW5ncyA9IG5ldyBTZXQoWy4uLmFsbExhbmdzLCAuLi5sYW5nc10pXG4gICAgICBmb3IgKGNvbnN0IGxhbmcgb2YgbGFuZ3MpIHtcbiAgICAgICAgY29uc3QgcmVzQnVuZGxlOiBSZXNCdW5kbGUgPSB7fVxuICAgICAgICByZXNCdW5kbGVbbGFuZ10gPSB7fVxuXG4gICAgICAgIGNvbnN0IGxhbmdEaXIgPSBwYXRoLmpvaW4obmV4dExvY2FsZURpciwgbGFuZykgLy8gdG9wIGxldmVsIGxhbmcgZGlyXG4gICAgICAgIGNvbnN0IGxhbmdGaWxlcyA9IGZpbmRBbGwoXG4gICAgICAgICAgb3B0aW9ucy5pbmNsdWRlIHx8IFsnKiovKi5qc29uJywgJyoqLyoueW1sJywgJyoqLyoueWFtbCddLFxuICAgICAgICAgIGxhbmdEaXJcbiAgICAgICAgKSAvLyBhbGwgbGFuZyBmaWxlcyBtYXRjaGluZyBwYXR0ZXJucyBpbiBsYW5nRGlyXG5cbiAgICAgICAgZm9yIChjb25zdCBsYW5nRmlsZSBvZiBsYW5nRmlsZXMpIHtcbiAgICAgICAgICBsb2FkZWRGaWxlcy5wdXNoKGxhbmdGaWxlKSAvLyB0cmFjayBmb3IgZmFzdCBob3QgcmVsb2FkIG1hdGNoaW5nXG4gICAgICAgICAgbG9nLmluZm8oJ1xcdCcgKyBsYW5nRmlsZSwge1xuICAgICAgICAgICAgdGltZXN0YW1wOiB0cnVlLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gbG9hZEFuZFBhcnNlKGxhbmdGaWxlKVxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMubmFtZXNwYWNlUmVzb2x1dGlvbikge1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZUZpbGVwYXRoOiBzdHJpbmcgPSBsYW5nRmlsZVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubmFtZXNwYWNlUmVzb2x1dGlvbiA9PT0gJ3JlbGF0aXZlUGF0aCcpIHtcbiAgICAgICAgICAgICAgbmFtZXNwYWNlRmlsZXBhdGggPSBwYXRoLnJlbGF0aXZlKHBhdGguam9pbihuZXh0TG9jYWxlRGlyLCBsYW5nKSwgbGFuZ0ZpbGUpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubmFtZXNwYWNlUmVzb2x1dGlvbiA9PT0gJ2Jhc2VuYW1lJykge1xuICAgICAgICAgICAgICBuYW1lc3BhY2VGaWxlcGF0aCA9IHBhdGguYmFzZW5hbWUobGFuZ0ZpbGUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBleHRuYW1lID0gcGF0aC5leHRuYW1lKGxhbmdGaWxlKVxuICAgICAgICAgICAgY29uc3QgbmFtZXNwYWNlUGFydHMgPSBuYW1lc3BhY2VGaWxlcGF0aC5yZXBsYWNlKGV4dG5hbWUsICcnKS5zcGxpdChwYXRoLnNlcClcbiAgICAgICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IFtsYW5nXS5jb25jYXQobmFtZXNwYWNlUGFydHMpLmpvaW4oJy4nKVxuICAgICAgICAgICAgc2V0UHJvcGVydHkocmVzQnVuZGxlLCBuYW1lc3BhY2UsIGNvbnRlbnQpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc0J1bmRsZVtsYW5nXSA9IGNvbnRlbnRcbiAgICAgICAgICB9XG4gICAgICAgICAgYXBwUmVzQnVuZGxlID0gbWVyZ2UoYXBwUmVzQnVuZGxlLCByZXNCdW5kbGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gb25lIGJ1bmRsZSAtIHdvcmtzLCBubyBpc3N1ZXMgd2l0aCBkYXNoZXMgaW4gbmFtZXNcbiAgICAvLyBjb25zdCBidW5kbGUgPSBgZXhwb3J0IGRlZmF1bHQgJHtKU09OLnN0cmluZ2lmeShhcHBSZXNCdW5kbGUpfWBcblxuICAgIC8vIG5hbWVkIGV4cG9ydHMsIHJlcXVpcmVzIG1hbmlwdWxhdGlvbiBvZiBuYW1lc1xuICAgIGxldCBuYW1lZEJ1bmRsZSA9ICcnXG4gICAgZm9yIChjb25zdCBsYW5nIG9mIGFsbExhbmdzKSB7XG4gICAgICBuYW1lZEJ1bmRsZSArPSBgZXhwb3J0IGNvbnN0ICR7anNOb3JtYWxpemVkTGFuZyhsYW5nKX0gPSAke0pTT04uc3RyaW5naWZ5KFxuICAgICAgICBhcHBSZXNCdW5kbGVbbGFuZ11cbiAgICAgICl9XFxuYFxuICAgIH1cbiAgICBsZXQgZGVmYXVsdEV4cG9ydCA9ICdjb25zdCByZXNvdXJjZXMgPSB7IFxcbidcbiAgICBmb3IgKGNvbnN0IGxhbmcgb2YgYWxsTGFuZ3MpIHtcbiAgICAgIGRlZmF1bHRFeHBvcnQgKz0gYFwiJHtsYW5nfVwiOiAke2pzTm9ybWFsaXplZExhbmcobGFuZyl9LFxcbmBcbiAgICB9XG4gICAgZGVmYXVsdEV4cG9ydCArPSAnfSdcbiAgICBkZWZhdWx0RXhwb3J0ICs9ICdcXG5leHBvcnQgZGVmYXVsdCByZXNvdXJjZXNcXG4nXG5cbiAgICBjb25zdCBidW5kbGUgPSBuYW1lZEJ1bmRsZSArIGRlZmF1bHRFeHBvcnRcblxuICAgIGxvZy5pbmZvKGBMb2NhbGVzIG1vZHVsZSAnJHtyZXNvbHZlZFZpcnR1YWxNb2R1bGVJZH0nOmAsIHtcbiAgICAgIHRpbWVzdGFtcDogdHJ1ZSxcbiAgICB9KVxuXG4gICAgLy8gZW11bGF0ZSBsb2cuaW5mbyBmb3Igb3VyIG1hcmtlZCB0ZXJtaW5hbCBvdXRwdXRcbiAgICBpZiAoTG9nTGV2ZWxzW29wdGlvbnMubG9nTGV2ZWwgfHwgJ3dhcm4nXSA+PSBMb2dMZXZlbHNbJ2luZm8nXSkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBtYXJrZWQoYFxuXFxgXFxgXFxganNcbiR7YnVuZGxlfVxuXFxgXFxgXFxgXG5gKVxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYnVuZGxlXG4gIH1cblxuICBjb25zdCBwbHVnaW46IFBsdWdpbiA9IHtcbiAgICBuYW1lOiAndml0ZS1wbHVnaW4taTE4bmV4dC1sb2FkZXInLCAvLyByZXF1aXJlZCwgd2lsbCBzaG93IHVwIGluIHdhcm5pbmdzIGFuZCBlcnJvcnNcbiAgICByZXNvbHZlSWQoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdmlydHVhbE1vZHVsZUlkKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZFxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuICAgIGxvYWQoaWQpIHtcbiAgICAgIGlmIChpZCAhPT0gcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cblxuICAgICAgY29uc3QgYnVuZGxlID0gbG9hZExvY2FsZXMoKVxuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGxvYWRlZEZpbGVzKSB7XG4gICAgICAgIHRoaXMuYWRkV2F0Y2hGaWxlKGZpbGUpXG4gICAgICB9XG4gICAgICByZXR1cm4gYnVuZGxlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdhdGNoIHRyYW5zbGF0aW9uIG1lc3NhZ2UgZmlsZXMgYW5kIHRyaWdnZXIgYW4gdXBkYXRlLlxuICAgICAqXG4gICAgICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vdml0ZWpzL3ZpdGUvaXNzdWVzLzY4NzEgPC0gYXMgaXMgaW1wbGVtZW50ZWQgbm93LCB3aXRoIGEgZnVsbCByZWxvYWRcbiAgICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRlanMvdml0ZS9wdWxsLzEwMzMzIDwtIFRPRE8gdGhpcyBpcyB0aGUgb25lIHRoYXQgd291bGQgYmUgZWFzaWVzdCBhbmQgbWF5IG5vdCBiZSBhIGZ1bGwgcmVsb2FkXG4gICAgICovXG4gICAgaGFuZGxlSG90VXBkYXRlKHsgZmlsZSwgc2VydmVyIH0pIHtcbiAgICAgIGlmIChsb2FkZWRGaWxlcy5pbmNsdWRlcyhmaWxlKSkge1xuICAgICAgICBsb2cuaW5mbyhgQ2hhbmdlZCBsb2NhbGUgZmlsZTogJHtmaWxlfWAsIHtcbiAgICAgICAgICB0aW1lc3RhbXA6IHRydWUsXG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc3QgeyBtb2R1bGVHcmFwaCwgd3MgfSA9IHNlcnZlclxuICAgICAgICBjb25zdCBtb2R1bGUgPSBtb2R1bGVHcmFwaC5nZXRNb2R1bGVCeUlkKHJlc29sdmVkVmlydHVhbE1vZHVsZUlkKVxuICAgICAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgICAgbG9nLmluZm8oXG4gICAgICAgICAgICBgSW52YWxpZGF0ZWQgbW9kdWxlICcke3Jlc29sdmVkVmlydHVhbE1vZHVsZUlkfScgLSBzZW5kaW5nIGZ1bGwgcmVsb2FkYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGltZXN0YW1wOiB0cnVlLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIClcbiAgICAgICAgICBtb2R1bGVHcmFwaC5pbnZhbGlkYXRlTW9kdWxlKG1vZHVsZSlcbiAgICAgICAgICAvLyBzZXJ2ZXIucmVsb2FkTW9kdWxlKG1vZHVsZSkgLy8gVE9ETyB3aXRoIHZpdGUgMy4yIHNlZSBodHRwczovL2dpdGh1Yi5jb20vdml0ZWpzL3ZpdGUvcHVsbC8xMDMzMywgbWF5IGFsc28gYmUgYWJsZSB0byByZW1vdmUgZnVsbCByZWxvYWRcbiAgICAgICAgICBpZiAod3MpIHtcbiAgICAgICAgICAgIHdzLnNlbmQoe1xuICAgICAgICAgICAgICB0eXBlOiAnZnVsbC1yZWxvYWQnLFxuICAgICAgICAgICAgICBwYXRoOiAnKicsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gIH1cbiAgcmV0dXJuIHBsdWdpblxufVxuXG5leHBvcnQgZGVmYXVsdCBmYWN0b3J5XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9rdXJkaW4vcHJvamVjdHMvcGFzdGVCYXIvUGFzdGVCYXJBcHAvcGFja2FnZXMvcGFzdGViYXItYXBwLXVpL3NyYy9saWIvaTE4bi12aXRlLWxvYWRlZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2t1cmRpbi9wcm9qZWN0cy9wYXN0ZUJhci9QYXN0ZUJhckFwcC9wYWNrYWdlcy9wYXN0ZWJhci1hcHAtdWkvc3JjL2xpYi9pMThuLXZpdGUtbG9hZGVkL3V0aWxzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9rdXJkaW4vcHJvamVjdHMvcGFzdGVCYXIvUGFzdGVCYXJBcHAvcGFja2FnZXMvcGFzdGViYXItYXBwLXVpL3NyYy9saWIvaTE4bi12aXRlLWxvYWRlZC91dGlscy50c1wiO2ltcG9ydCBmcyBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuLy8gQHRzLWV4cGVjdC1lcnJvciBubyB0eXBlc1xuaW1wb3J0IGdsb2JBbGwgZnJvbSAnZ2xvYi1hbGwnXG5pbXBvcnQgKiBhcyB5YW1sIGZyb20gJ2pzLXlhbWwnXG5cbi8vIGRvbid0IGV4cG9ydCB0aGVzZSBmcm9tIGluZGV4IHNvIHRoZSBleHRlcm5hbCB0eXBlcyBhcmUgY2xlYW5lclxuZXhwb3J0IGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9ICd2aXJ0dWFsOmkxOG5leHQtbG9hZGVyJ1xuZXhwb3J0IGNvbnN0IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkID0gJ1xcMCcgKyB2aXJ0dWFsTW9kdWxlSWRcblxuZXhwb3J0IGZ1bmN0aW9uIGpzTm9ybWFsaXplZExhbmcobGFuZzogc3RyaW5nKSB7XG4gIHJldHVybiBsYW5nLnJlcGxhY2UoLy0vLCAnXycpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtZXJhdGVMYW5ncyhkaXI6IHN0cmluZykge1xuICByZXR1cm4gZnMucmVhZGRpclN5bmMoZGlyKS5maWx0ZXIoZnVuY3Rpb24gKGZpbGUpIHtcbiAgICByZXR1cm4gZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpciwgZmlsZSkpLmlzRGlyZWN0b3J5KClcbiAgfSlcbn1cblxuLy9odHRwczovL2dpdGh1Yi5jb20vanBpbGxvcmEvbm9kZS1nbG9iLWFsbCN1c2FnZVxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbGwoZ2xvYnM6IHN0cmluZyB8IHN0cmluZ1tdLCBjd2Q6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZ2xvYkFycmF5ID0gQXJyYXkuaXNBcnJheShnbG9icykgPyBnbG9icyA6IFtnbG9ic11cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtY2FsbFxuICByZXR1cm4gZ2xvYkFsbC5zeW5jKGdsb2JBcnJheSwgeyBjd2QsIHJlYWxwYXRoOiB0cnVlIH0pIGFzIHN0cmluZ1tdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlUGF0aHMocGF0aHM6IHN0cmluZ1tdLCBjd2Q6IHN0cmluZykge1xuICByZXR1cm4gcGF0aHMubWFwKG92ZXJyaWRlID0+IHtcbiAgICBpZiAocGF0aC5pc0Fic29sdXRlKG92ZXJyaWRlKSkge1xuICAgICAgcmV0dXJuIG92ZXJyaWRlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwYXRoLmpvaW4oY3dkLCBvdmVycmlkZSlcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFeGlzdGVuY2UocGF0aHM6IHN0cmluZ1tdKSB7XG4gIGZvciAoY29uc3QgZGlyIG9mIHBhdGhzKSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0OiAke2Rpcn1gKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEFuZFBhcnNlKGxhbmdGaWxlOiBzdHJpbmcpIHtcbiAgY29uc3QgZmlsZUNvbnRlbnQgPSBTdHJpbmcoZnMucmVhZEZpbGVTeW5jKGxhbmdGaWxlKSlcbiAgY29uc3QgZXh0bmFtZSA9IHBhdGguZXh0bmFtZShsYW5nRmlsZSlcbiAgbGV0IHBhcnNlZENvbnRlbnQ6IHN0cmluZ1xuICBpZiAoZXh0bmFtZSA9PT0gJy55YW1sJyB8fCBleHRuYW1lID09PSAnLnltbCcpIHtcbiAgICBwYXJzZWRDb250ZW50ID0geWFtbC5sb2FkKGZpbGVDb250ZW50KSBhcyBzdHJpbmdcbiAgfSBlbHNlIHtcbiAgICBwYXJzZWRDb250ZW50ID0gSlNPTi5wYXJzZShmaWxlQ29udGVudClcbiAgfVxuICByZXR1cm4gcGFyc2VkQ29udGVudFxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFDRSxNQUFRO0FBQUEsTUFDUixTQUFXO0FBQUEsTUFDWCxTQUFXO0FBQUEsTUFDWCxTQUFXO0FBQUEsUUFDVCxLQUFPO0FBQUEsUUFDUCxPQUFTO0FBQUEsUUFDVCxPQUFTO0FBQUEsUUFDVCxZQUFZO0FBQUEsUUFDWixRQUFVO0FBQUEsUUFDVixNQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFXO0FBQUEsUUFDWCxjQUFj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O0FBQUEsVUFDMUMsU0FBU0EsTUFBSyxRQUFRLGtDQUFXLG9CQUFvQjtBQUFBLFVBQ3JELFlBQVlBLE1BQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxRQUM3RDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixnQkFBZ0I7QUFBQSxRQUNkLFNBQVMsQ0FBQztBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLQSxNQUFLLEtBQUssa0NBQVcsS0FBSztBQUFBLE1BQ2pDO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLFFBQ0osT0FBTztBQUFBLFVBQ0wsU0FBUztBQUFBLFlBQ1A7QUFBQSxZQUNBLENBQUMsK0JBQStCLG1CQUFtQjtBQUFBLFVBQ3JEO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsY0FBYztBQUFBLE1BQ2QsZUFBYztBQUFBLFFBQ1osT0FBTyxDQUFDLG9CQUFvQjtBQUFBLFFBQzVCLHFCQUFxQjtBQUFBLE1BQ3ZCLENBQUM7QUFBQSxNQUNELGVBQWU7QUFBQSxRQUNiLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxNQUFNO0FBQUEsVUFDUjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNEO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixjQUFjO0FBQ1osZ0JBQU0sY0FBYztBQUNwQixnQkFBTSxVQUFVLFlBQVk7QUFDNUIsVUFBQUMsSUFBRyxNQUFNRCxNQUFLLEtBQUssa0NBQVcsU0FBUyxHQUFHLEVBQUUsV0FBVyxNQUFNLEdBQUcsTUFBTTtBQUNwRSxrQkFBTSxjQUFjQSxNQUFLLEtBQUssa0NBQVcsV0FBVyxjQUFjLE9BQU8sRUFBRTtBQUMzRSxZQUFBQyxJQUFHLGNBQWMsYUFBYSxPQUFPO0FBQ3JDLGtCQUFNLFlBQVlELE1BQUssS0FBSyxrQ0FBVyxlQUFlO0FBQ3RELGtCQUFNLGFBQWFBLE1BQUssS0FBSyxrQ0FBVyx1QkFBdUI7QUFDL0QsWUFBQUMsSUFBRyxPQUFPLFdBQVcsWUFBWSxFQUFDLFdBQVcsS0FBSSxDQUFDO0FBQ2xELGtCQUFNLFVBQVVELE1BQUssS0FBSyxrQ0FBVyxpQkFBaUI7QUFDdEQsa0JBQU0sV0FBV0EsTUFBSyxLQUFLLGtDQUFXLHlCQUF5QjtBQUMvRCxZQUFBQyxJQUFHLE9BQU8sU0FBUyxVQUFVLEVBQUMsV0FBVyxLQUFJLENBQUM7QUFBQSxVQUNoRCxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbImZzIiwgInBhdGgiLCAicGF0aCIsICJwYXRoIiwgInBhdGgiLCAiZnMiXQp9Cg==
