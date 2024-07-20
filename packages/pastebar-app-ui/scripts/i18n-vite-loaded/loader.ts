import path from 'node:path'
import { setProperty } from 'dot-prop'
import { marked } from 'marked'
import TerminalRenderer from 'marked-terminal'
import { merge } from 'ts-deepmerge'
import { createLogger, LogLevel, Plugin } from 'vite'

import {
  assertExistence,
  enumerateLangs,
  findAll,
  jsNormalizedLang,
  loadAndParse,
  resolvedVirtualModuleId,
  resolvePaths,
  virtualModuleId,
} from './utils'

marked.setOptions({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  renderer: new TerminalRenderer(),
})

// unfortunately not exported
export const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
}

export interface Options {
  /**
   * Set to 'info' for noisy information.
   *
   * Default: 'warn'
   */
  logLevel?: LogLevel

  /**
   * Glob patterns to match files
   *
   * Default: ['**\/*.json', '**\/*.yml', '**\/*.yaml']
   */
  include?: string[]

  /**
   * Locale top level directory paths ordered from least specialized to most specialized
   *  e.g. lib locale -> app locale
   *
   * Locales loaded later will overwrite any duplicated key via a deep merge strategy.
   */
  paths: string[]

  /**
   * Default: none
   */
  namespaceResolution?: 'basename' | 'relativePath'
}

export interface ResBundle {
  [key: string]: string | object
}

// for fast match on hot reloading check?
let loadedFiles: string[] = []
let allLangs: Set<string> = new Set()

const factory = (options: Options) => {
  const log = createLogger(options.logLevel || 'warn', { prefix: '[i18next-loader]' })

  function loadLocales() {
    const localeDirs = resolvePaths(options.paths, process.cwd())
    assertExistence(localeDirs)

    //
    let appResBundle: ResBundle = {}
    loadedFiles = [] // reset
    log.info('Bundling locales (ordered least specific to most):', {
      timestamp: true,
    })
    localeDirs.forEach(nextLocaleDir => {
      // all subdirectories match language codes
      const langs = enumerateLangs(nextLocaleDir)
      allLangs = new Set([...allLangs, ...langs])
      for (const lang of langs) {
        const resBundle: ResBundle = {}
        resBundle[lang] = {}

        const langDir = path.join(nextLocaleDir, lang) // top level lang dir
        const langFiles = findAll(
          options.include || ['**/*.json', '**/*.yml', '**/*.yaml'],
          langDir
        ) // all lang files matching patterns in langDir

        for (const langFile of langFiles) {
          loadedFiles.push(langFile) // track for fast hot reload matching
          log.info('\t' + langFile, {
            timestamp: true,
          })

          const content = loadAndParse(langFile)

          if (options.namespaceResolution) {
            let namespaceFilepath: string = langFile
            if (options.namespaceResolution === 'relativePath') {
              namespaceFilepath = path.relative(path.join(nextLocaleDir, lang), langFile)
            } else if (options.namespaceResolution === 'basename') {
              namespaceFilepath = path.basename(langFile)
            }
            const extname = path.extname(langFile)
            const namespaceParts = namespaceFilepath.replace(extname, '').split(path.sep)
            const namespace = [lang].concat(namespaceParts).join('.')
            setProperty(resBundle, namespace, content)
          } else {
            resBundle[lang] = content
          }
          appResBundle = merge(appResBundle, resBundle)
        }
      }
    })

    // one bundle - works, no issues with dashes in names
    // const bundle = `export default ${JSON.stringify(appResBundle)}`

    // named exports, requires manipulation of names
    let namedBundle = ''
    for (const lang of allLangs) {
      namedBundle += `export const ${jsNormalizedLang(lang)} = ${JSON.stringify(
        appResBundle[lang]
      )}\n`
    }
    let defaultExport = 'const resources = { \n'
    for (const lang of allLangs) {
      defaultExport += `"${lang}": ${jsNormalizedLang(lang)},\n`
    }
    defaultExport += '}'
    defaultExport += '\nexport default resources\n'

    const bundle = namedBundle + defaultExport

    log.info(`Locales module '${resolvedVirtualModuleId}':`, {
      timestamp: true,
    })

    // emulate log.info for our marked terminal output
    if (LogLevels[options.logLevel || 'warn'] >= LogLevels['info']) {
      // eslint-disable-next-line no-console
      console.log(
        marked(`
\`\`\`js
${bundle}
\`\`\`
`)
      )
    }
    return bundle
  }

  const plugin: Plugin = {
    name: 'vite-plugin-i18next-loader', // required, will show up in warnings and errors
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return null
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) {
        return null
      }

      const bundle = loadLocales()
      for (const file of loadedFiles) {
        this.addWatchFile(file)
      }
      return bundle
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
          timestamp: true,
        })

        const { moduleGraph, ws } = server
        const module = moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) {
          log.info(
            `Invalidated module '${resolvedVirtualModuleId}' - sending full reload`,
            {
              timestamp: true,
            }
          )
          moduleGraph.invalidateModule(module)
          // server.reloadModule(module) // TODO with vite 3.2 see https://github.com/vitejs/vite/pull/10333, may also be able to remove full reload
          if (ws) {
            ws.send({
              type: 'full-reload',
              path: '*',
            })
          }
        }
      }
    },
  }
  return plugin
}

export default factory
