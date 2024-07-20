import { useEffect, useState } from 'react'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '~/components/ui/toast'
import { ToasterToast, useToast } from '~/components/ui/use-toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const [toast, setToast] = useState<ToasterToast | null>(null)

  useEffect(() => {
    if (toasts.length > 0) {
      setToast(toasts[0])
    } else {
      setToast(null)
    }
  }, [toasts])

  return (
    <ToastProvider duration={12000}>
      {toasts.map(function ({ id, title, description, action, duration, ...props }) {
        return (
          <Toast key={id} duration={duration} {...props}>
            <div className="flex flex-col w-full">
              <div className="flex justify-start items-center w-full p-2 gap-2 mr-4">
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && <ToastDescription>{description}</ToastDescription>}
                </div>
                {action}
              </div>
              <ToastClose />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
