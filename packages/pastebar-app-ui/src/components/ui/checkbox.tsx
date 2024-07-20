import { useEffect, useState } from 'react'
import { cva, VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

const CheckBoxVariants = cva(
  "before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 dark:border-slate-600 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-11 before:w-11 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity hover:before:opacity-5",
  {
    variants: {
      color: {
        default:
          'checked:border-slate-500 checked:bg-slate-500 before:bg-slate-500 text-slate-700 dark:before:bg-slate-100',
        danger:
          'checked:border-2 checked:border-red-500 dark:checked:border-red-500 checked:bg-red-500 before:bg-red-500 text-red-700 dark:before:bg-red-100',
      },
    },
    defaultVariants: {
      color: 'default',
    },
  }
)

export function Checkbox({
  className,
  children,
  id = randomStringId(),
  color,
  classNameLabel = '',
  onChange,
  checked: initialChecked = false,
}: {
  className?: string
  classNameLabel?: string
  children: React.ReactNode
  id?: string
  onChange?: (checked: boolean) => void
  checked?: boolean
} & VariantProps<typeof CheckBoxVariants>) {
  const [checked, setChecked] = useState(initialChecked)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked
    setChecked(newChecked)
    if (onChange) {
      onChange(newChecked)
    }
  }

  useEffect(() => {
    if (checked !== initialChecked) {
      setChecked(initialChecked)
    }
  }, [initialChecked])

  return (
    <div className="inline-flex items-center">
      <label
        className={`relative flex cursor-pointer items-center rounded-full p-3 ${classNameLabel}`}
        htmlFor={id}
        data-ripple-dark="true"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          className={cn('form-checkbox', CheckBoxVariants({ color, className }))}
          onChange={handleChange}
        />
        <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
      </label>
      <label
        className={cn(
          'mt-px cursor-pointer select-none font-light',
          color === 'danger' && checked && 'text-red-600 font-medium'
        )}
        htmlFor={id}
      >
        {children}
      </label>
    </div>
  )
}

function randomStringId() {
  return Math.random()
    .toString(36)
    .slice(2, 2 + 10)
}
