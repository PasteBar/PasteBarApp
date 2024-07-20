import { format as formatFNS, Locale } from 'date-fns'

import { en, es, ru, uk } from './date-locales'

const locales = { en, es, ru, uk } as { [key: string]: Locale }

export default function format(date: Date, formatStr = 'Pp') {
  return formatFNS(date, formatStr, {
    locale: locales[window.__locale__ || 'en'],
  })
}
