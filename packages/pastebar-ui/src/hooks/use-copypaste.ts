import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

type UseClipboardProps = {
  successDuration?: number
  delay?: number
  onCopied?: () => void
}

type UseClipboardPasteProps = {
  successDuration?: number
  delay?: number
  onPasted?: () => void
}

export const useCopyPaste = ({
  delay = 800,
  onCopied = () => {},
}: UseClipboardProps): [boolean, (text: string) => void] => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = (text: string) => {
    if (text?.length > 0 && !isCopied) {
      setIsCopied(true)
      setTimeout(() => {
        invoke('copy_text', { text })
          .then(res => {
            if (res === 'ok') {
              requestAnimationFrame(() => {
                setIsCopied(false)
              })
              onCopied()
            } else {
              setIsCopied(false)
              console.error('Failed to copy text', res)
            }
          })
          .catch(err => {
            setIsCopied(false)
            console.error('Failed to copy text', err)
          })
      }, delay)
    }
  }

  return [isCopied, handleCopy]
}

export const useClipboardPaste = ({
  delay = 800,
  onPasted = () => {},
}: UseClipboardPasteProps): [
  string,
  number | null,
  (text: string, delayInSec?: number) => void,
] => {
  const [pastedText, setPastedText] = useState('')
  const [pastedItemCountDown, setPastedItemCountDown] = useState<number | null>(null)
  const { copyPasteDelay } = useAtomValue(settingsStoreAtom)
  const countdownRef = useRef<number>(0)

  const executePasteAction = (text: string, delay = 0) => {
    invoke('copy_paste', { text, delay })
      .then(res => {
        if (res === 'ok') {
          requestAnimationFrame(() => {
            setPastedText('')
            onPasted()
          })
        } else {
          setPastedText('')
          console.error('Failed to copy paste text', res)
        }
      })
      .catch(err => {
        setPastedText('')
        console.error('Failed to copy paste text', err)
      })
  }

  useEffect(() => {
    if (pastedItemCountDown && pastedItemCountDown > 0) {
      countdownRef.current = setInterval(() => {
        setPastedItemCountDown(prev => (prev ? prev - 1 : null))
      }, 1000) as unknown as number
    } else if (pastedItemCountDown === 0) {
      if (pastedText) {
        setPastedItemCountDown(null)
        setTimeout(() => {
          executePasteAction(pastedText, 0)
        }, delay)
      }
      clearInterval(countdownRef.current)
    } else if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [pastedItemCountDown, pastedText])

  const handlePaste = (text: string, delayInSec?: number) => {
    delayInSec = delayInSec ?? copyPasteDelay

    if (text && !pastedText) {
      setPastedText(text)

      if (delayInSec > 0) {
        setPastedItemCountDown(delayInSec)
      } else {
        setTimeout(() => {
          executePasteAction(text, delayInSec)
        }, delay)
      }
    }
  }
  return [pastedText, pastedItemCountDown, handlePaste]
}
