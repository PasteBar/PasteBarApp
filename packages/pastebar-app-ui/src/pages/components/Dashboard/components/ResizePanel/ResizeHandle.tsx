import { GripVertical } from 'lucide-react'

import { PanelResizeHandle } from '~/components/libs/react-resizable-panels/src'

import styles from './styles.module.css'

export default function ResizeHandle({
  isVertical = false,
  className = '',
  id,
}: {
  isVertical?: boolean
  className?: string
  id?: string
}) {
  return (
    <PanelResizeHandle
      className={`${styles.ResizeHandleOuter} ${className} opacity-0 hover:opacity-100 transition-opacity`}
      id={id}
    >
      <div className={styles.ResizeHandleInner}>
        <GripVertical
          className={`${styles.Icon} ${
            isVertical ? 'rotate-90' : ''
          } text-slate-300 dark:text-slate-500`}
          type="resize-vertical"
        />
      </div>
    </PanelResizeHandle>
  )
}
