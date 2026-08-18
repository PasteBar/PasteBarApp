import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { clsx } from 'clsx'
import TextareaAutosize from 'react-textarea-autosize'

import InputHeader from '../../atoms/fundamentals/input-header'
import EmojiPicker from '../emoji-picker'

export interface TextAreaRef {
  getInputElement: () => HTMLTextAreaElement | null
  handleAddBBcode: (bbcode: string) => void
  handleAddText: (text: string) => void
  handleRemoveTemplateField: (label: string | undefined) => void
  handleRemoveAllTemplateFields: () => void
  handleRemoveBBcodes: (bbcodes: string[]) => void
}

type TextareaProps = React.ComponentPropsWithRef<'textarea'> & {
  error?: string | undefined
  label: string
  key?: string
  enableEmoji?: boolean
  enableEmojiInside?: boolean
  withTooltip?: boolean
  isDisabled?: boolean
  tooltipText?: string
  classNameArea?: string
  className?: string
  maxRows?: number
  autoFocus?: boolean
  maxLength?: number
  onMouseDown?: (event: React.MouseEvent<HTMLTextAreaElement>) => void
  onClick?: (event: React.MouseEvent<HTMLTextAreaElement>) => void
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void
  tooltipProps?: Record<string, unknown>
  children?: React.ReactNode
  containerProps?: React.HTMLAttributes<HTMLDivElement>
}

const TextArea = forwardRef<TextAreaRef, TextareaProps>(
  (
    {
      placeholder,
      label,
      name,
      key,
      value,
      required,
      withTooltip = false,
      tooltipText,
      tooltipProps = {},
      autoFocus = false,
      containerProps,
      maxLength,
      className,
      classNameArea,
      isDisabled = false,
      onFocus = () => {},
      onBlur = () => {},
      onPaste = () => {},
      onChange = () => {},
      onClick = () => {},
      onMouseDown = () => {},
      onKeyDown = () => {},
      rows = 2,
      maxRows = 5,
      enableEmoji = true,
      enableEmojiInside = false,
      error,
    }: TextareaProps,
    ref
  ) => {
    const inputRef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
      if (inputRef.current && autoFocus) {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 200)
      }
    }, [autoFocus])

    const handleRemoveTemplateField = (label: string | undefined) => {
      if (!inputRef.current || !label) {
        return
      }

      const labelRegex = new RegExp(`\\{{\\s*${label}\\s*\\}}`, 'gi')
      const newValue = inputRef.current.value.replaceAll(labelRegex, '')
      inputRef.current.value = newValue

      // Trigger onChange event
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: newValue,
          },
        }
        onChange(syntheticEvent as never)
      }
    }

    const handleRemoveAllTemplateFields = () => {
      if (!inputRef.current) {
        return
      }

      const newValue = inputRef.current.value.replace(/\{\{.*?\}\}/g, '')
      inputRef.current.value = newValue

      // Trigger onChange event
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: newValue,
          },
        }
        onChange(syntheticEvent as never)
      }
    }

    const handleRemoveBBcodes = (bbcodes: string[]) => {
      if (!inputRef.current) {
        return
      }

      const startPosition = inputRef.current.selectionStart || 0
      const endPosition = inputRef.current.selectionEnd || 0
      let selectedText = inputRef.current.value.substring(startPosition, endPosition)

      bbcodes.forEach(bbcode => {
        const openTagRegex = new RegExp(`\\[${bbcode}\\]`, 'g')
        const closeTagRegex = new RegExp(`\\[/${bbcode}\\]`, 'g')
        selectedText = selectedText.replace(openTagRegex, '')
        selectedText = selectedText.replace(closeTagRegex, '')
      })

      // Update the textarea value with the modified text
      const newValue = `${inputRef.current.value.substring(
        0,
        startPosition
      )}${selectedText}${inputRef.current.value.substring(endPosition)}`
      inputRef.current.value = newValue

      // Update the cursor position
      inputRef.current.selectionStart = startPosition
      inputRef.current.selectionEnd = startPosition + selectedText.length
      inputRef.current.focus()

      // Trigger onChange event
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: newValue,
          },
        }
        onChange(syntheticEvent as never)
      }
    }

    const handleAddBBcode = (bbcode: string) => {
      if (!inputRef.current) {
        return
      }

      const startPosition = inputRef.current.selectionStart || 0
      const endPosition = inputRef.current.selectionEnd || 0
      const selectedText = inputRef.current.value.substring(startPosition, endPosition)
      const openTag = `[${bbcode}]`
      const closeTag = `[/${bbcode}]`

      let newValue = ''
      if (selectedText) {
        // Wrap the selected text with BBCode
        newValue = `${inputRef.current.value.substring(
          0,
          startPosition
        )}${openTag}${selectedText}${closeTag}${inputRef.current.value.substring(
          endPosition
        )}`
      } else {
        // Insert the BBCode tags at the current cursor position
        newValue = `${inputRef.current.value.substring(
          0,
          startPosition
        )}${openTag}${closeTag}${inputRef.current.value.substring(startPosition)}`
      }

      // Update the textarea value to reflect the new text with BBCode
      inputRef.current.value = newValue

      // Update the cursor position
      const newCursorPosition = startPosition + openTag.length
      inputRef.current.selectionStart = newCursorPosition
      inputRef.current.selectionEnd = newCursorPosition
      inputRef.current.focus()

      // Trigger onChange event
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: newValue,
          },
        }
        onChange(syntheticEvent as never)
      }
    }

    const handleAddEmoji = (emoji: string) => {
      if (!inputRef.current) {
        return
      }

      const position = inputRef.current.selectionStart || 0

      const startPosition = inputRef.current.selectionStart || 0
      const endPosition = inputRef.current.selectionEnd || 0

      const newValue =
        startPosition > 0
          ? `${inputRef.current.value.substring(
              0,
              startPosition
            )}${emoji}${inputRef.current.value.substring(endPosition)}`
          : `${emoji}${inputRef.current.value}`

      inputRef.current.value = newValue

      if (onChange) {
        const syntheticEvent = {
          target: {
            value: newValue,
          },
        }
        onChange(syntheticEvent as never)
      }

      // Set the cursor position after the inserted emoji
      inputRef.current.selectionStart = position + emoji.length
      inputRef.current.selectionEnd = position + emoji.length
      inputRef.current.focus()
    }

    useImperativeHandle(ref, () => ({
      getInputElement: () => inputRef.current,
      handleRemoveBBcodes,
      handleAddText: handleAddEmoji,
      handleRemoveTemplateField,
      handleRemoveAllTemplateFields,
      handleAddBBcode,
    }))

    const handleEmojiPickerClose = () => {
      setTimeout(() => {
        // Delay the focus call to make sure the emoji picker is fully closed
        inputRef?.current?.focus()
      }, 100)
    }

    return (
      <div className={className} {...containerProps}>
        {label && (
          <InputHeader
            {...{ label, required, withTooltip, tooltipText, tooltipProps }}
            className="mb-0.5 text-slate-400 font-light text-xs ml-1 uppercase"
          />
        )}
        <div className="relative">
          <TextareaAutosize
            maxRows={maxRows}
            minRows={rows}
            className={clsx(
              'focus-within:shadow-input focus-within:border-violet-60 px-small py-xsmall bg-grey-5 border-grey-20 rounded rounded-rounded flex w-full flex-col border',
              {
                'focus:ring-red-500 focus:border-red-500 border-red-400 dark:focus:ring-red-500 dark:focus:border-red-500 dark:border-red-400':
                  error,
              },
              'relative bg-inherit outline-none outline-0 focus:overflow-auto',
              'remove-number-spinner leading-base text-grey-90 caret-violet-60 placeholder-grey-40 w-full font-normal',
              'focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
              'px-3 py-1 pb-2 leading-base text-grey-90',
              classNameArea
            )}
            ref={inputRef}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            maxLength={maxLength}
            onFocus={onFocus}
            onBlur={onBlur}
            onMouseDown={onMouseDown}
            onClick={onClick}
            name={name}
            disabled={isDisabled}
            onChange={onChange}
            onKeyDown={onKeyDown}
            key={key || name}
            autoFocus={false}
            value={value || ''}
            onPaste={onPaste}
            placeholder={placeholder || ''}
          />
          {enableEmoji && (
            <div className="flex justify-start items-center w-full h-8 ml-1">
              <EmojiPicker
                onEmojiClick={handleAddEmoji}
                onCloseAutoFocus={() => {
                  handleEmojiPickerClose()
                  const syntheticEvent = {
                    target: {
                      value: inputRef?.current?.value,
                    },
                  }
                  onChange(syntheticEvent as never)
                }}
              />
            </div>
          )}
          {enableEmojiInside && (
            <div className="flex justify-start items-center absolute right-1.5 bottom-1.5">
              <EmojiPicker
                onEmojiClick={handleAddEmoji}
                onCloseAutoFocus={() => {
                  handleEmojiPickerClose()
                  const syntheticEvent = {
                    target: {
                      value: inputRef?.current?.value,
                    },
                  }
                  onChange(syntheticEvent as never)
                }}
              />
            </div>
          )}
        </div>
        {error && (
          <div className={clsx('text-sm animate fade-in text-red-400', className)}>
            <p>{error}</p>
          </div>
        )}
      </div>
    )
  }
)

export default TextArea
