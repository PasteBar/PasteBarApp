export default function growShrinkColor(value: number, type: 'bg' | 'text') {
  if (value > 0) {
    return type === 'bg'
      ? 'bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-100'
      : 'text-emerald-600 dark:text-emerald-400'
  }

  if (value < 0) {
    return type === 'bg'
      ? 'bg-red-100 dark:bg-red-500/20 dark:text-red-100'
      : 'text-red-600 dark:text-red-500'
  }

  return ''
}
