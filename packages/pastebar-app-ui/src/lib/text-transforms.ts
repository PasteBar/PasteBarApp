/**
 * Text transformation utilities for special copy/paste operations
 * Organized by categories with enable/disable controls
 */

import DOMPurify from 'dompurify'

export interface TextTransform {
  id: string
  label: string
  transform: (text: string) => string | Promise<string>
}

export interface TransformCategory {
  id: string
  label: string
  transforms?: TextTransform[]
  subcategories?: TransformSubcategory[]
}

export interface TransformSubcategory {
  id: string
  label: string
  transforms: TextTransform[]
}

// Transform functions for Text Case
const toUpperCase = (text: string): string => text.toUpperCase()
const toLowerCase = (text: string): string => text.toLowerCase()
const toTitleCase = (text: string): string =>
  text.replace(/\b\w/g, char => char.toUpperCase()) // Renamed from toCapitalize
const toSentenceCase = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() // Keep as is, assumes single string capitalization
const toInvertCase = (text: string): string =>
  text.replace(/[a-zA-Z]/g, char =>
    char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
  )

// Transform functions for Code Formatting
const toCamelCase = (text: string): string => {
  const normalized = text.replace(/[^a-zA-Z0-9]+/g, ' ').trim() // Normalize spaces/delimiters
  return normalized
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
}

const toSnakeCase = (text: string): string => {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // Add underscore before capital letters (camelCase to snake_case part)
    .replace(/[^a-zA-Z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .toLowerCase()
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

const toKebabCase = (text: string): string => {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Add hyphen before capital letters
    .replace(/[^a-zA-Z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .toLowerCase()
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

const toPascalCase = (text: string): string => {
  const normalized = text.replace(/[^a-zA-Z0-9]+/g, ' ').trim() // Normalize spaces/delimiters
  return normalized
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '')
}

// Transform functions for Whitespace & Lines
const trimWhiteSpace = (text: string): string => text.trim()
const removeLineFeeds = (
  text: string
): string => // More aggressive removal of multiple line feeds to single space
  text
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const addOneLineFeed = (text: string): string => text + '\n'
const addTwoLineFeeds = (text: string): string => text + '\n\n'
const removeExtraSpaces = (text: string): string => text.replace(/\s+/g, ' ')
const sortLinesAlphabetically = (text: string): string => {
  const lines = text.split(/\r?\n|\r/)
  return lines.sort((a, b) => a.localeCompare(b)).join('\n')
}
const removeDuplicateLines = (text: string): string => {
  const lines = text.split(/\r?\n|\r/)
  const uniqueLines = [...new Set(lines)]
  return uniqueLines.join('\n')
}
const addLineNumbers = (text: string): string => {
  const lines = text.split(/\r?\n|\r/)
  return lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
}

// Transform functions for Encoding & Security
const toBase64Encode = (text: string): string => {
  try {
    // This is generally the most robust method for UTF-8 in browsers without polyfills
    return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
  } catch (e) {
    console.error('Base64 encode error:', e)
    return text
  }
}
const toBase64Decode = (text: string): string => {
  try {
    // This is generally the most robust method for UTF-8 in browsers without polyfills
    return new TextDecoder().decode(
      Uint8Array.from(atob(text), charCode => charCode.charCodeAt(0))
    )
  } catch (e) {
    console.error('Base64 decode error:', e)
    return text
  }
}
const toUrlEncode = (text: string): string => encodeURIComponent(text)
const toUrlDecode = (text: string): string => {
  try {
    return decodeURIComponent(text)
  } catch (e) {
    console.error('URL decode error:', e)
    return text
  }
}

function toHtmlEncode(str: string): string {
  // Ensure the input is a string
  if (typeof str !== 'string') {
    console.warn('Input to encodeHtmlSpecialChars was not a string:', str)
    return '' // Or throw an error, depending on desired behavior
  }

  return str.replace(/[&<>"']/g, function (char) {
    switch (char) {
      case '&':
        return '&amp;' // Ampersand
      case '<':
        return '&lt;' // Less than
      case '>':
        return '&gt;' // Greater than
      case '"':
        return '&quot;' // Double quote
      case "'":
        return '&#039;' // Single quote (apostrophe)
      default:
        return char // Should not happen with the given regex, but good practice
    }
  })
}

const toHtmlDecode = (text: string): string => {
  const sanitized = DOMPurify.sanitize(text, { RETURN_DOM: true })
  return sanitized.textContent || ''
}

// Transform functions for Text Tools
const reverseText = (text: string): string => text.split('').reverse().join('')
const addCurrentDateTime = (text: string): string => {
  const now = new Date()
  return text + '\n' + now.toLocaleString()
}
const countCharacters = (text: string): string => {
  const count = text.length
  return `Character count: ${count}`
}
const countWords = (text: string): string => {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
  const count = words.length
  return `Word count: ${count}`
}
const countLines = (text: string): string => {
  const lines = text.split(/\r?\n|\r/)
  const count = lines.length
  return `Line count: ${count}`
}
const countSentences = (text: string): string => {
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
  const count = sentences.length
  return `Sentence count: ${count}`
}
const toJsonStringify = (text: string): string => {
  try {
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return JSON.stringify(text) // If not valid JSON, stringify the text itself
  }
}

// Helper function to strip HTML tags and return plain text with normalized whitespace
const stripHtmlTags = (html: string): string => {
  // First, add line breaks before block-level elements to preserve structure
  const blockElements = [
    'p',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'address',
    'article',
    'aside',
    'footer',
    'header',
    'nav',
    'section',
    'table',
    'tr',
    'br',
  ]

  // Create regex pattern for block elements
  const blockRegex = new RegExp(`<(${blockElements.join('|')})[^>]*>`, 'gi')

  // Add newlines before block elements to preserve structure
  let processedHtml = html.replace(blockRegex, '\n<$1>')

  // Create a temporary div element
  const div = document.createElement('div')
  div.innerHTML = processedHtml
  // Get text content, which automatically strips all HTML tags
  const text = div.textContent || div.innerText || ''

  // Normalize whitespace while preserving structure
  return text
    .replace(/\r\n/g, '\n') // Normalize Windows line endings to Unix
    .replace(/\r/g, '\n') // Normalize old Mac line endings to Unix
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with double newline
    .replace(/\t+/g, '\t') // Replace multiple tabs with single tab
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .replace(/\n[ \t]+/g, '\n') // Remove spaces/tabs at the beginning of lines
    .replace(/[ \t]+\n/g, '\n') // Remove spaces/tabs at the end of lines
    .replace(/\n{2,}/g, '\n') // Replace multiple newlines with single newline
    .trim() // Remove leading and trailing whitespace
}

// Format Converter subcategories - organized by source format
const formatConverterSubcategories = [
  {
    id: 'html',
    label: 'HTML',
    transforms: [
      {
        id: 'htmlToMarkdown',
        label: 'HTML to Markdown',
        transform: (text: string) => convertFormat(text, 'html_to_markdown'),
      },
      {
        id: 'htmlToReact',
        label: 'HTML to React JSX',
        transform: (text: string) => convertFormat(text, 'html_to_react'),
      },
      {
        id: 'htmlToReactComponent',
        label: 'HTML to React Component',
        transform: (text: string) => convertFormat(text, 'html_to_react_components'),
      },
      {
        id: 'htmlToText',
        label: 'HTML to Text',
        transform: (text: string) => convertFormat(text, 'html_to_text'),
      },
      {
        id: 'htmlToPlainText',
        label: 'HTML to Plain Text',
        transform: async (text: string) => {
          // dynamic import for html-to-text
          const { convert } = await import('html-to-text')
          return convert(text, {
            wordwrap: 130,
            preserveNewlines: false,
            // selectors: [{ selector: 'a', format:  }],
          })
            .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with double newline
            .trim() // Remove leading and trailing whitespace
        },
      },
      // {
      //   id: 'htmlToPlainText',
      //   label: 'HTML to Plain Text',
      //   transform: (text: string) => stripHtmlTags(text),
      // },
    ],
  },
  {
    id: 'markdown',
    label: 'Markdown',
    transforms: [
      {
        id: 'markdownToHtml',
        label: 'Markdown to HTML',
        transform: (text: string) => convertFormat(text, 'markdown_to_html'),
      },
      {
        id: 'markdownToText',
        label: 'Markdown to Text',
        transform: (text: string) => convertFormat(text, 'markdown_to_text'),
      },
    ],
  },
  {
    id: 'json',
    label: 'JSON',
    transforms: [
      {
        id: 'jsonToCsv',
        label: 'JSON to CSV',
        transform: (text: string) => convertFormat(text, 'json_to_csv'),
      },
      {
        id: 'jsonToYaml',
        label: 'JSON to YAML',
        transform: (text: string) => convertFormat(text, 'json_to_yaml'),
      },
      {
        id: 'jsonToXml',
        label: 'JSON to XML',
        transform: (text: string) => convertFormat(text, 'json_to_xml'),
      },
      {
        id: 'jsonToToml',
        label: 'JSON to TOML',
        transform: (text: string) => convertFormat(text, 'json_to_toml'),
      },
      {
        id: 'jsonToTable',
        label: 'JSON to Markdown Table',
        transform: (text: string) => convertFormat(text, 'json_to_table'),
      },
    ],
  },
  {
    id: 'csv',
    label: 'CSV',
    transforms: [
      {
        id: 'csvToJson',
        label: 'CSV to JSON',
        transform: (text: string) => convertFormat(text, 'csv_to_json'),
      },
      {
        id: 'csvToTable',
        label: 'CSV to Markdown Table',
        transform: (text: string) => convertFormat(text, 'csv_to_table'),
      },
    ],
  },
  {
    id: 'yaml',
    label: 'YAML',
    transforms: [
      {
        id: 'yamlToJson',
        label: 'YAML to JSON',
        transform: (text: string) => convertFormat(text, 'yaml_to_json'),
      },
    ],
  },
  {
    id: 'xml',
    label: 'XML',
    transforms: [
      {
        id: 'xmlToJson',
        label: 'XML to JSON',
        transform: (text: string) => convertFormat(text, 'xml_to_json'),
      },
    ],
  },
  {
    id: 'toml',
    label: 'TOML',
    transforms: [
      {
        id: 'tomlToJson',
        label: 'TOML to JSON',
        transform: (text: string) => convertFormat(text, 'toml_to_json'),
      },
    ],
  },
]

// Helper function to call Rust format conversion
function convertFormat(text: string, conversionType: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri')
      const result = await invoke('format_convert', { text, conversionType })
      resolve(result as string)
    } catch (error) {
      console.error(`Format conversion failed for ${conversionType}:`, error)

      // Show error dialog to user
      try {
        const { message } = await import('@tauri-apps/api/dialog')
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Clean up the error message for better user experience
        const cleanErrorMessage = errorMessage
          .replace(/^Error: /, '')
          .replace(/^format_convert returned an error: /, '')

        await message(`${cleanErrorMessage}`, {
          title: 'Format Conversion Error',
          type: 'error',
        })
      } catch (dialogError) {
        console.error('Failed to show error dialog:', dialogError)
      }

      // Reject the promise so the error propagates and prevents copy/paste
      reject(error)
    }
  })
}

// Special Convert category will be implemented in Rust later for better performance

// Categorized transformations
export const TRANSFORM_CATEGORIES: TransformCategory[] = [
  {
    id: 'textCase',
    label: 'Text Case',
    transforms: [
      { id: 'upperCase', label: 'UPPER CASE', transform: toUpperCase },
      { id: 'lowerCase', label: 'lower case', transform: toLowerCase },
      { id: 'titleCase', label: 'Title Case', transform: toTitleCase },
      { id: 'sentenceCase', label: 'Sentence case', transform: toSentenceCase },
      { id: 'invertCase', label: 'iNVERT cASE', transform: toInvertCase },
    ],
  },
  {
    id: 'codeFormatting',
    label: 'Code Formatting',
    transforms: [
      { id: 'camelCase', label: 'camelCase', transform: toCamelCase },
      { id: 'snakeCase', label: 'snake_case', transform: toSnakeCase },
      { id: 'kebabCase', label: 'kebab-case', transform: toKebabCase },
      { id: 'pascalCase', label: 'PascalCase', transform: toPascalCase },
      { id: 'jsonStringify', label: 'JSON Stringify', transform: toJsonStringify },
    ],
  },
  {
    id: 'whitespaceLines',
    label: 'Whitespace & Lines',
    transforms: [
      { id: 'trimWhiteSpace', label: 'Trim White Space', transform: trimWhiteSpace },
      { id: 'removeLineFeeds', label: 'Remove Line Feeds', transform: removeLineFeeds },
      { id: 'addOneLineFeed', label: 'Add One Line Feed', transform: addOneLineFeed },
      { id: 'addTwoLineFeeds', label: 'Add Two Line Feeds', transform: addTwoLineFeeds },
      {
        id: 'removeExtraSpaces',
        label: 'Remove Extra Spaces',
        transform: removeExtraSpaces,
      },
      {
        id: 'sortLinesAlphabetically',
        label: 'Sort Lines Alphabetically',
        transform: sortLinesAlphabetically,
      },
      {
        id: 'removeDuplicateLines',
        label: 'Remove Duplicate Lines',
        transform: removeDuplicateLines,
      },
      { id: 'addLineNumbers', label: 'Add Line Numbers', transform: addLineNumbers },
    ],
  },
  {
    id: 'encodingSecurity',
    label: 'Encode/Decode',
    transforms: [
      { id: 'base64Encode', label: 'Base64 Encode', transform: toBase64Encode },
      { id: 'base64Decode', label: 'Base64 Decode', transform: toBase64Decode },
      { id: 'urlEncode', label: 'URL Encode', transform: toUrlEncode },
      { id: 'urlDecode', label: 'URL Decode', transform: toUrlDecode },
      { id: 'htmlEncode', label: 'HTML Encode', transform: toHtmlEncode },
      { id: 'htmlDecode', label: 'HTML Decode', transform: toHtmlDecode },
    ],
  },
  {
    id: 'textTools',
    label: 'Text Tools',
    transforms: [
      { id: 'reverseText', label: 'Reverse Text', transform: reverseText },
      {
        id: 'addCurrentDateTime',
        label: 'Add Current Date/Time',
        transform: addCurrentDateTime,
      },
      { id: 'countCharacters', label: 'Count Characters', transform: countCharacters },
      { id: 'countWords', label: 'Count Words', transform: countWords },
      { id: 'countLines', label: 'Count Lines', transform: countLines },
      { id: 'countSentences', label: 'Count Sentences', transform: countSentences },
    ],
  },
  {
    id: 'formatConverter',
    label: 'Format Converter',
    subcategories: formatConverterSubcategories,
  },
]

// Flat list of all transformations for backward compatibility
export const TEXT_TRANSFORMS: TextTransform[] = TRANSFORM_CATEGORIES.flatMap(category => {
  if (category.subcategories) {
    // For categories with subcategories, flatten all transforms from all subcategories
    return category.subcategories.flatMap(subcategory => subcategory.transforms)
  } else {
    // For categories with direct transforms
    return category.transforms || []
  }
})

// Helper to get a transform by ID
export const getTransformById = (id: string): TextTransform | undefined =>
  TEXT_TRANSFORMS.find(t => t.id === id)

// Helper to get a category by ID
export const getCategoryById = (id: string): TransformCategory | undefined =>
  TRANSFORM_CATEGORIES.find(c => c.id === id)

// Helper to apply a transform by ID
export const applyTransform = async (
  text: string,
  transformId: string
): Promise<string> => {
  const transform = getTransformById(transformId)
  if (!transform) {
    throw new Error(`Transform not found: ${transformId}`)
  }

  try {
    const result = transform.transform(text)
    // Handle both sync and async transforms
    return await Promise.resolve(result)
  } catch (error) {
    console.error(`Transform failed for ${transformId}:`, error)
    // Re-throw the error so calling functions can handle it
    throw error
  }
}

// Helper to get all category IDs
export const getAllCategoryIds = (): string[] => TRANSFORM_CATEGORIES.map(c => c.id)

// Helper to get all transform IDs in a category
export const getTransformIdsInCategory = (categoryId: string): string[] => {
  const category = getCategoryById(categoryId)
  return category ? category.transforms?.map(t => t.id) ?? [] : []
}
