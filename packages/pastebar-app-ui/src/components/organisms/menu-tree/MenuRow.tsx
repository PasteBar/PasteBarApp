import { message } from '@tauri-apps/api/dialog'
import { useTranslation } from 'react-i18next'

import { RowRendererProps } from '~/components/libs/react-arborist'

import { isHoveringMenuRowId } from '.'

export default function MenuRow<T>({
  node,
  attrs,
  innerRef,
  children,
}: RowRendererProps<T>) {
  const isHovering = isHoveringMenuRowId.value === node.id
  const { t } = useTranslation()
  return (
    <div
      {...attrs}
      key={node.id}
      onMouseEnter={() => {
        isHoveringMenuRowId.value = node.id
      }}
      onMouseLeave={() => {
        isHoveringMenuRowId.value = null
      }}
      ref={innerRef}
      className={`${isHovering ? 'bg-slate-100/90 dark:bg-gray-900/90' : ''} ${
        node.isEditing ? 'border border-blue-400 dark:!bg-slate-900' : ''
      } ${
        !node.data.isActive
          ? `not-active-background ${
              !node.isEditing
                ? 'line-through dark:text-slate-600 text-slate-400'
                : 'dark:text-slate-800 bg-slate-800'
            } dark:bg-slate-900 bg-slate-200`
          : ''
      } ${
        node.isSelected && !node.isEditing ? 'dark:!bg-slate-600 dark:!text-slate-50' : ''
      } transition-all overflow-hidden`}
      onFocus={e => e.stopPropagation()}
      onClick={node.handleClick}
      onDoubleClickCapture={() => {
        if (node.isEditing) return
        if (node.data.isClip) {
          message(
            t(
              'Menu is link to a clip and cannot be renamed. Please rename its linked clip.',
              {
                ns: 'menus',
              }
            ),
            'PasteBar'
          )

          return
        }
        node.edit()
      }}
      onKeyDown={e => {
        if (node.data.isClip) {
          e.stopPropagation()
          message(
            t(
              'Menu is link to a clip and cannot be renamed. Please rename its linked clip.',
              {
                ns: 'menus',
              }
            ),
            'PasteBar'
          )

          return
        }
        if (e.key === 'Enter') {
          node.edit()
        }
      }}
    >
      {children}
    </div>
  )
}
