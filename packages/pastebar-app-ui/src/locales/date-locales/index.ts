import { format, Locale } from 'date-fns'
import en from 'date-fns/locale/en-US'
import esES from 'date-fns/locale/es'
import it from 'date-fns/locale/it'
import ru from 'date-fns/locale/ru'
import uk from 'date-fns/locale/uk'
import zhCN from 'date-fns/locale/zh-CN'

interface LocaleMap {
  [key: string]: Locale
}

const locales: LocaleMap = { en, esES, ru, uk, it, zhCN }

export function formatLocale(date: Date | number, formatStr = 'Pp'): string {
  const currentLocale = window.__locale__ || 'en'
  const localeToUse = locales[currentLocale] || en

  return format(date, formatStr, {
    locale: localeToUse,
  })
}

export { locales }
