import { useMemo, useState } from 'react'

import { SimpleTree } from '../data/simple-tree'
import {
  CreateHandler,
  DeleteHandler,
  MoveHandler,
  RenameHandler,
} from '../types/handlers'

let nextId = 0

export function useDynamicTree<T>() {
  const [data, setData] = useState<T[]>([])
  useMemo(
    () =>
      new SimpleTree<// @ts-ignore
      T>(data),
    [data]
  )

  return { data, setData } as const
}
