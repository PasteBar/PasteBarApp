import { clsx } from 'clsx'

import { CursorProps } from '~/components/libs/react-arborist'

import styles from './menu-tree.module.css'

export default function Cursor({ top, left }: CursorProps) {
  return (
    <div
      className={clsx(styles.dropCursor, 'border-slate-400 border-dashed border-t-2')}
      style={{ top: top - 1, left }}
    ></div>
  )
}
