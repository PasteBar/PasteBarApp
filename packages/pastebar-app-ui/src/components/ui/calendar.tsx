'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '~/lib/utils'

import { buttonVariants } from '~/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        // eslint-disable-next-line camelcase
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        // eslint-disable-next-line camelcase
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        // eslint-disable-next-line camelcase
        nav_button_previous: 'absolute left-1',
        // eslint-disable-next-line camelcase
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        // eslint-disable-next-line camelcase
        head_row: 'flex',
        // eslint-disable-next-line camelcase
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        // eslint-disable-next-line camelcase
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        // eslint-disable-next-line camelcase
        day_today: 'bg-accent text-accent-foreground',
        // eslint-disable-next-line camelcase
        day_outside: 'text-muted-foreground opacity-50',
        // eslint-disable-next-line camelcase
        day_disabled: 'text-muted-foreground opacity-50',
        // eslint-disable-next-line camelcase
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        // eslint-disable-next-line camelcase
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
