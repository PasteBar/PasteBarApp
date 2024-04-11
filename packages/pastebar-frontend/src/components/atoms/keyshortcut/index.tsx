import { uiStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

const Shortcut = ({ keys }: { keys: string }) => {
  const { isWindows } = useAtomValue(uiStoreAtom)

  // Check for platform and replace 'ALT' with the Option symbol for Mac
  const displayKeys = isWindows ? keys : keys.replace('ALT+', '⌥')

  return <span>{displayKeys}</span>
}

export { Shortcut }
