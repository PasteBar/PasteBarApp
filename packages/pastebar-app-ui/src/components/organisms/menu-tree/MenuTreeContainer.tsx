import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'

import ToolTip from '~/components/atoms/tooltip'
import { ListInnerElement } from '~/components/libs/react-arborist/components/list-inner-element'
import { ListOuterElement } from '~/components/libs/react-arborist/components/list-outer-element'
import { RowContainer } from '~/components/libs/react-arborist/components/row-container'
import { useDataUpdates, useTreeApi } from '~/components/libs/react-arborist/context'
import { Text } from '~/components/ui'

export default function MenuTreeContainer() {
  const { t } = useTranslation()
  useDataUpdates()
  const tree = useTreeApi()
  return (
    <div
      style={{
        width: tree.width,
        minHeight: 0,
        minWidth: 0,
      }}
      onContextMenu={tree.props.onContextMenu}
      onClick={tree.props.onClick}
      tabIndex={0}
    >
      {tree.isFiltered && (
        <div className="text-slate-400 text-sm rounded-sm mb-1 mt-1 flex items-center justify-center">
          <ToolTip
            text={t('Clear found results', { ns: 'common' })}
            className="animate-in fade-in fade-out duration-300"
            isCompact
            delayDuration={2000}
            side="top"
            onClick={() => {
              tree.onSearchClear()
            }}
            sideOffset={5}
          >
            <Text className="text-xs text-center bg-blue-200 rounded-full px-3 cursor-pointer pointer-events-auto">
              {tree.visibleNodes.length ? (
                <>
                  {tree.visibleNodes.length < 100 ? tree.visibleNodes.length : '100+'}{' '}
                  {t('found', { ns: 'common' })}
                </>
              ) : (
                <>{t('Nothing found', { ns: 'common' })}</>
              )}
            </Text>
          </ToolTip>
        </div>
      )}
      <FixedSizeList
        className={tree.props.className}
        outerRef={tree.listEl}
        itemCount={tree.visibleNodes.length}
        height={tree.visibleNodes.length * tree.rowHeight}
        width={tree.width}
        itemSize={tree.rowHeight}
        overscanCount={tree.overscanCount}
        itemKey={(index: number) => tree.visibleNodes[index]?.id || index}
        outerElementType={ListOuterElement}
        innerElementType={ListInnerElement}
        onItemsRendered={tree.onItemsRendered.bind(tree)}
        ref={tree.list}
      >
        {RowContainer}
      </FixedSizeList>
    </div>
  )
}
