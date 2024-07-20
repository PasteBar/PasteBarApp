import { ReactNode, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { FixedSizeList } from 'react-window'
import { createStore, Store } from 'redux'
import { useSyncExternalStore } from 'use-sync-external-store/shim'

import { DataUpdatesContext, DndContext, NodesContext, TreeApiContext } from '../context'
import { TreeApi } from '../interfaces/tree-api'
import { initialState } from '../state/initial'
import { actions as visibility } from '../state/open-slice'
import { rootReducer, RootState } from '../state/root-reducer'
import { TreeProps } from '../types/tree-props'
import { IdObj } from '../types/utils'

type Props<T> = {
  treeProps: TreeProps<T>
  imperativeHandle: React.Ref<TreeApi<T> | undefined>
  children: ReactNode
}

const SERVER_STATE = initialState()

export function TreeProvider<T>({ treeProps, imperativeHandle, children }: Props<T>) {
  const list = useRef<FixedSizeList | null>(null)
  const listEl = useRef<HTMLDivElement | null>(null)
  const store = useRef<Store>(createStore(rootReducer, initialState(treeProps)))
  const state = useSyncExternalStore<RootState>(
    store.current.subscribe,
    store.current.getState,
    () => SERVER_STATE
  )

  /* The tree api object is stable. */
  const api = useMemo(() => {
    return new TreeApi<T>(store.current, treeProps, list, listEl)
  }, [])

  /* Make sure the tree instance stays in sync */
  const updateCount = useRef(0)
  useMemo(() => {
    updateCount.current += 1
    api.update(treeProps)
  }, [...Object.values(treeProps), state.nodes.open])

  /* Expose the tree api */
  useImperativeHandle(imperativeHandle, () => api)

  /* Change selection based on props */
  useEffect(() => {
    if (api.props.selection) {
      api.select(api.props.selection, { focus: false })
    } else {
      api.deselectAll()
    }
  }, [api.props.selection])

  useEffect(() => {
    if (api.props.selectedIds && api.props.selectedIds.length > 0) {
      api.setSelectIds(api.props.selectedIds)
    } else {
      api.deselectAll()
    }
  }, [api.props.selectedIds])

  /* Clear visability for filtered nodes */
  useEffect(() => {
    if (!api.props.searchTerm) {
      store.current.dispatch(visibility.clear(true))
    }
  }, [api.props.searchTerm])

  return (
    <TreeApiContext.Provider value={api}>
      <DataUpdatesContext.Provider value={updateCount.current}>
        <NodesContext.Provider value={state.nodes}>
          <DndContext.Provider value={state.dnd}>
            <DndProvider
              backend={HTML5Backend}
              options={{ rootElement: api.props.dndRootElement || undefined }}
              {...(treeProps.dndManager && { manager: treeProps.dndManager })}
            >
              {children}
            </DndProvider>
          </DndContext.Provider>
        </NodesContext.Provider>
      </DataUpdatesContext.Provider>
    </TreeApiContext.Provider>
  )
}
