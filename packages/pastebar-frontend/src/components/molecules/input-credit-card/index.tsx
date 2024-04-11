import {
  ChangeEventHandler,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { clsx } from 'clsx'

import InputHeader, { InputHeaderProps } from '../../atoms/fundamentals/input-header'

const cardNumberFn = (val: string | undefined) => {
  if (val) {
    const cardValue = val.replace(/\D/g, '').match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/)

    if (cardValue && cardValue.length > 1) {
      return !cardValue[2]
        ? cardValue[1]
        : `${cardValue[1]} ${cardValue[2]}${`${
            cardValue[3] ? ` ${cardValue[3]}` : ''
          }`}${`${cardValue[4] ? ` ${cardValue[4]}` : ''}`}`
    }
    return val
  }
}

const maskedCardFn = (val: string | undefined) => {
  if (val) {
    const cardNumber = cardNumberFn(val) ?? ''
    return cardNumber.replace(/\d(?=(?:\D*\d){4})/g, '•')
  }
  return val
}

export type InputCreditCardProps = Omit<React.ComponentPropsWithRef<'input'>, 'prefix'> &
  InputHeaderProps & {
    small?: boolean
    label?: string
    name?: string
    showHideCCNumber?: boolean
    autoFocus?: boolean
    onChange?: ChangeEventHandler<HTMLInputElement>
    onInputBlur?: (value: string) => void
    ccNumber: string | undefined
    error?: string | undefined
    readOnly?: boolean
    prefix?: React.ReactNode
    suffix?: React.ReactNode
    classNameInput?: string
    props?: React.HTMLAttributes<HTMLDivElement>
  }

const InputCreditCardField = forwardRef<HTMLInputElement, InputCreditCardProps>(
  (
    {
      small,
      placeholder,
      label,
      name = '',
      autoFocus = false,
      required,
      ccNumber,
      readOnly,
      onInputBlur,
      showHideCCNumber = false,
      tooltipContent,
      tooltip,
      prefix,
      error,
      props,
      className,
      classNameInput,
      ...fieldProps
    }: InputCreditCardProps,
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const [showNumber, setShowNumber] = useState(false)
    const [card, setCard] = useState<string | undefined>(ccNumber)

    useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
      ref,
      () => inputRef.current
    )

    const handleChange = () => {
      if (!inputRef.current || !inputRef.current.value) {
        return
      }

      const value = cardNumberFn(inputRef.current.value) ?? ''
      const numbers = value.replace(/(\D)/g, '')
      if (inputRef.current.value !== value) {
        inputRef.current.value = value
      }
      setCard(numbers)
    }

    useEffect(() => {
      if (!inputRef.current) {
        return
      }
      if (showNumber) {
        const ccNumber = cardNumberFn(card) ?? ''
        inputRef.current.value = ccNumber
      }
    }, [card])

    useEffect(() => {
      if (showNumber && inputRef.current && card) {
        inputRef.current.value = cardNumberFn(card) ?? ''
      }
      if (!showNumber && inputRef.current) {
        inputRef.current.value = maskedCardFn(card) ?? ''
      }
    }, [showNumber])

    useEffect(() => {
      if (inputRef.current && autoFocus) {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 200)
      }
    }, [autoFocus])

    return (
      <div className={clsx('w-full', className)} {...props}>
        {label && (
          <InputHeader
            {...{ label, required, tooltipContent, tooltip }}
            className="mb-0.5 text-slate-400 font-light text-xs ml-1 uppercase"
          />
        )}
        <div className="relative">
          {prefix ? <span className="text-grey-40 mr-2xsmall">{prefix}</span> : null}
          <input
            className={clsx(
              'bg-grey-5 border-gray-20 px-small py-xsmall rounded rounded-rounded flex w-full items-center border',
              'focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
              'remove-number-spinner px-3 leading-base text-grey-90 caret-violet-60 placeholder-grey-40 w-full bg-transparent font-normal outline-none outline-0',
              {
                'focus:ring-red-500 focus:border-red-500 border-red-400 dark:focus:ring-red-500 dark:focus:border-red-500 dark:border-red-400':
                  error,
              },
              small ? 'h-8' : 'h-10',
              { '!pr-8': showHideCCNumber },
              { 'text-small': small, 'pt-[1px]': small },
              classNameInput
            )}
            ref={inputRef}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            type="text"
            name={name}
            defaultValue={maskedCardFn(ccNumber)}
            placeholder={placeholder || `${label}...` || ''}
            onChange={handleChange}
            onFocus={() => {
              if (!readOnly) setShowNumber(true)
            }}
            onBlur={() => {
              if (onInputBlur && card) {
                onInputBlur(card.trim().replaceAll(' ', ''))
              }
            }}
            {...fieldProps}
          />
          <button
            className="mx-2xsmall text-grey-40 absolute right-2.5 top-0 bottom-0 flex items-center justify-center"
            onClick={() => {
              setShowNumber(prev => !prev)
            }}
          >
            {showNumber ? (
              <svg viewBox="0 0 15 15" fill="none" width={15} height={15}>
                <path
                  d="M13.3536 2.35355C13.5488 2.15829 13.5488 1.84171 13.3536 1.64645C13.1583 1.45118 12.8417 1.45118 12.6464 1.64645L10.6828 3.61012C9.70652 3.21671 8.63759 3 7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C0.902945 9.08812 2.02314 10.1861 3.36061 10.9323L1.64645 12.6464C1.45118 12.8417 1.45118 13.1583 1.64645 13.3536C1.84171 13.5488 2.15829 13.5488 2.35355 13.3536L4.31723 11.3899C5.29348 11.7833 6.36241 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C14.0971 5.9119 12.9769 4.81391 11.6394 4.06771L13.3536 2.35355ZM9.90428 4.38861C9.15332 4.1361 8.34759 4 7.5 4C4.80285 4 2.52952 5.37816 1.09622 7.50001C1.87284 8.6497 2.89609 9.58106 4.09974 10.1931L9.90428 4.38861ZM5.09572 10.6114L10.9003 4.80685C12.1039 5.41894 13.1272 6.35031 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11C6.65241 11 5.84668 10.8639 5.09572 10.6114Z"
                  fill="currentColor"
                  fillRule="evenodd"
                ></path>
              </svg>
            ) : (
              <svg viewBox="0 0 15 15" fill="none" width={15} height={15}>
                <path
                  d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                ></path>
              </svg>
            )}
          </button>
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

InputCreditCardField.displayName = 'InputCreditCardField'

export default InputCreditCardField
