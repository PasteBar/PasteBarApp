import { useMemo, useRef } from 'react'
import { Signal, signal } from '@preact/signals-react'

const Empty = [] as const

export function useSignal<T>(value: T) {
  const $signal = useRef<Signal<T>>()
  return ($signal.current ??= signal<T>(value))
}

export function useSignalMemo<T>(value: T) {
  return useMemo(() => signal<T>(value), Empty)
}
