import { forwardRef } from 'react'

import { useValidatedProps } from '../hooks/use-validated-props'
import { TreeApi } from '../interfaces/tree-api'
import { TreeProps } from '../types/tree-props'
import { DragPreviewContainer } from './drag-preview-container'
import { OuterDrop } from './outer-drop'
import { TreeProvider } from './provider'
import { TreeContainer } from './tree-container'

function TreeComponent<T>(props: TreeProps<T>, ref: React.Ref<TreeApi<T> | undefined>) {
  const treeProps = useValidatedProps(props)
  return (
    <TreeProvider treeProps={treeProps} imperativeHandle={ref}>
      <OuterDrop>
        <TreeContainer />
      </OuterDrop>
      <DragPreviewContainer />
    </TreeProvider>
  )
}

export const Tree = forwardRef(TreeComponent) as <T>(
  props: TreeProps<T> & { ref?: React.ForwardedRef<TreeApi<T> | undefined> }
) => ReturnType<typeof TreeComponent>
