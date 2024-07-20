import { lazy, Suspense } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { EmojiClickData } from 'emoji-picker-react'
import { useTheme } from 'next-themes'

import Spinner from '~/components/atoms/spinner'

import Button from '../../atoms/fundamentals/button'
import HappyIcon from '../../atoms/fundamentals/icons/happy-icon'

// Use React.lazy to lazily load the EmojiPicker component
// @ts-ignore - TS doesn't support dynamic imports yet
const EmojiPicker = lazy(() => import('emoji-picker-react') as unknown)

// Render the EmojiPicker component once it's loaded
// return <EmojiPickerLazy onEmojiClick={onEmojiClick} Picker={Picker} />

const EmojiPickerDropDown: React.FC<{
  onEmojiClick: (emoji: string) => void
  onCloseAutoFocus?: () => void
}> = ({ onEmojiClick, onCloseAutoFocus }) => {
  const { theme } = useTheme()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        asChild
        onClick={e => {
          e.stopPropagation()
        }}
      >
        <Button
          variant="ghost"
          size="small"
          type="button"
          onClick={e => {
            e.stopPropagation()
          }}
          className="text-grey-40 hover:text-violet-60 h-5 w-5 p-0 focus:border-none focus:shadow-none"
        >
          <HappyIcon size={20} />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          onCloseAutoFocus={onCloseAutoFocus}
          sideOffset={5}
          className="z-99 min-w-[200px] min-h-[100px] overflow-hidden text-center flex justify-center items-center"
        >
          <Suspense fallback={<Spinner size="small" variant="primary" />}>
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData) => onEmojiClick(emojiData.emoji)}
              defaultSkinTone="NEUTRAL"
              theme={theme}
              emojiStyle="native"
              skinTonesDisabled
              searchPlaceHolder="Emoji..."
            />
          </Suspense>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default EmojiPickerDropDown
