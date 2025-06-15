// translation-audit.ts
// Script to audit missing translation keys in non-English YAML files
// Usage: Run with `ts-node` or compile to JS and run with `node`

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// Recursively scan a directory for files with given extensions
function scanFiles(dir: string, exts: string[], fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanFiles(fullPath, exts, fileList)
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

// Check if a translation key is used in any of the code files
function isKeyUsedInCode(key: string, codeFiles: string[]): boolean {
  // Accept both dot and bracket notation, e.g. t('common.key') or t("common.key")
  const keyPattern = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    if (keyPattern.test(content)) {
      return true
    }
  }
  return false
}

// Helper to flatten nested objects into dot notation keys
type AnyObject = Record<string, any>
function flattenKeys(obj: AnyObject, prefix = ''): string[] {
  let keys: string[] = []
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(flattenKeys(value, newKey))
    } else {
      keys.push(newKey)
    }
  }
  return keys
}

// Load supported languages from languges.ts (extract code from LANGUAGES array)
function loadSupportedLanguages(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  // Match LANGUAGES array of objects and extract code values
  const codeRegex = /code:\s*['"]([\w]+)['"]/g
  const codes: string[] = []
  let match
  while ((match = codeRegex.exec(content)) !== null) {
    codes.push(match[1])
  }
  if (codes.length === 0) throw new Error('No language codes found in LANGUAGES')
  return codes
}

// Main audit function
async function auditTranslations() {
  const baseDir = path.resolve(__dirname, '../packages/pastebar-app-ui/src/locales/lang')
  const enDir = path.join(baseDir, 'en')
  const langFile = path.join(baseDir, '../languges.ts')
  const report: string[] = []
  // Scan all code files in src (ts, tsx, js, jsx, vue, svelte)
  const codeDir = path.resolve(__dirname, '../packages/pastebar-app-ui/src')
  const codeFiles = scanFiles(codeDir, ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'])

  // 1. Load supported languages
  let languages: string[] = []
  try {
    languages = loadSupportedLanguages(langFile).filter(l => l !== 'en')
    report.push(`Loaded supported languages: ${languages.join(', ')}`)
  } catch (e) {
    report.push(`Error loading supported languages: ${e}`)
    return fs.writeFileSync('translation-audit-report.txt', report.join('\n'))
  }

  // 2. List English YAML files
  const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.yaml'))
  for (const enFile of enFiles) {
    const enPath = path.join(enDir, enFile)
    let enKeys: string[] = []
    let enParseError = ''
    try {
      const enData = yaml.load(fs.readFileSync(enPath, 'utf-8')) as AnyObject
      enKeys = flattenKeys(enData)
    } catch (e) {
      enParseError = String(e)
      report.push(`\n[${enFile}] English file parse error: ${enParseError}`)
      continue
    }
    report.push(`\n[${enFile}]`)
    for (const lang of languages) {
      const langPath = path.join(baseDir, lang, enFile)
      if (!fs.existsSync(langPath)) {
        report.push(`  [${lang}] MISSING FILE: All ${enKeys.length} keys missing.`)
        continue
      }
      try {
        const langData = yaml.load(fs.readFileSync(langPath, 'utf-8')) as AnyObject
        const langKeys = flattenKeys(langData)
        const missing = enKeys.filter(k => !langKeys.includes(k))
        if (missing.length > 0) {
          report.push(`  [${lang}] Missing keys (${missing.length}):`)
          for (const key of missing) {
            const used = isKeyUsedInCode(key, codeFiles)
            report.push(`    ${key}  ${used ? '[USED in code]' : '[NOT USED in code]'}`)
          }
        } else {
          report.push(`  [${lang}] All keys present.`)
        }
      } catch (e) {
        report.push(
          `  [${lang}] PARSE ERROR: ${e} (All ${enKeys.length} keys considered missing)`
        )
      }
    }
  }
  fs.writeFileSync('translation-audit-report.txt', report.join('\n'))
  console.log('Translation audit complete. See translation-audit-report.txt')
}

auditTranslations()
