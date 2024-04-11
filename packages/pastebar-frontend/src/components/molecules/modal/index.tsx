import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Portal from '@radix-ui/react-portal'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

import { Button } from '~/components/ui'

import { useWindowDimensions } from '~/hooks/use-window-dimensions'

type ModalState = {
  portalRef: React.RefObject<HTMLDivElement> | undefined
  onOutsideClick?: () => void
  isLargeModal?: boolean
}

export const ModalContext = React.createContext<ModalState>({
  portalRef: undefined,
  onOutsideClick: () => {},
  isLargeModal: true,
})

export type ModalProps = {
  isLargeModal?: boolean
  handleClose: () => void
  canClose?: boolean
  open?: boolean
  onOutsideClick?: () => void
  isNavVisible?: boolean
  children?: React.ReactNode
}

type ModalChildProps = {
  className?: string
  canClose?: boolean
  style?: React.CSSProperties
  children?: React.ReactNode
}

type ModalHeaderProps = {
  handleClose: () => void
  canClose?: boolean
  isCenter?: boolean
  children?: React.ReactNode
}

type ModalType = React.FC<ModalProps> & {
  Body: React.FC<ModalChildProps>
  Header: React.FC<ModalHeaderProps>
  Footer: React.FC<ModalChildProps>
  Content: React.FC<ModalChildProps>
  onOutsideClick?: () => void
  isNavVisible?: boolean
  canClose?: boolean
}

const Overlay: React.FC<
  React.PropsWithChildren & { isNavVisible?: boolean; outOutsideClick: () => void }
> = ({ children, isNavVisible = true, outOutsideClick = () => {} }) => {
  return (
    <Dialog.Overlay
      onClick={() => {
        outOutsideClick()
      }}
      className={`bg-slate-900/80 fixed ${
        isNavVisible ? 'top-10' : 'top-0'
      } bottom-0 left-0 right-0 z-50 grid place-items-center overflow-y-auto`}
    >
      {children}
    </Dialog.Overlay>
  )
}

const Content: React.FC<
  React.PropsWithChildren & {
    canClose?: boolean
    isLargeModal?: boolean
    outOutsideClick?: () => void
  }
> = ({ children, outOutsideClick, isLargeModal, canClose }) => {
  const { height } = useWindowDimensions()
  const style = {
    maxHeight: height - 64,
  }
  return canClose ? (
    <Dialog.Content
      style={style}
      className={`${
        isLargeModal ? '-mt-5' : '-mt-80'
      } min-w-modal rounded-lg outline-none bg-slate-100 dark:bg-slate-800 animate-in fade-in slide-in-from-top-10 duration-300 top-10`}
    >
      {children}
    </Dialog.Content>
  ) : (
    <Dialog.Content
      style={style}
      onPointerDownOutside={e => {
        outOutsideClick && outOutsideClick()
        e.preventDefault()
      }}
      onInteractOutside={e => {
        e.preventDefault()
      }}
      onEscapeKeyDown={e => {
        e.preventDefault()
      }}
      className={`${
        isLargeModal ? '-mt-5' : '-mt-80'
      } min-w-modal rounded-lg outline-none bg-slate-100 dark:bg-slate-800 animate-in fade-in slide-in-from-top-10 duration-300 top-10`}
    >
      {children}
    </Dialog.Content>
  )
}

const Modal: ModalType = ({
  open = true,
  handleClose,
  canClose = true,
  isNavVisible = true,
  isLargeModal = false,
  onOutsideClick = () => {},
  children,
}) => {
  const portalRef = React.useRef(null)
  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Portal.Portal ref={portalRef}>
        <ModalContext.Provider value={{ portalRef, isLargeModal, onOutsideClick }}>
          <Overlay isNavVisible={isNavVisible} outOutsideClick={onOutsideClick}>
            <Content canClose={canClose} outOutsideClick={onOutsideClick} isLargeModal>
              {children}
            </Content>
          </Overlay>
        </ModalContext.Provider>
      </Portal.Portal>
    </Dialog.Root>
  )
}

Modal.Body = ({ children, className, style }) => {
  const { isLargeModal, onOutsideClick } = React.useContext(ModalContext)

  return (
    <div
      style={style}
      className={clsx('h-[full]', className, {
        'max-w-2xl': isLargeModal,
        'max-w-md': !isLargeModal,
      })}
      onClick={e => {
        onOutsideClick && onOutsideClick()
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}

Modal.Content = ({ children, className }) => {
  const { isLargeModal, onOutsideClick } = React.useContext(ModalContext)

  const { height } = useWindowDimensions()
  const style = {
    maxHeight: height - 90 - 141,
  }
  return (
    <div
      data-tauri-drag-region
      onClick={() => {
        onOutsideClick && onOutsideClick()
      }}
      style={style}
      className={clsx(
        'overflow-y-auto px-8 pt-6',
        {
          ['w-largeModal pb-7']: isLargeModal,
          ['pb-5']: !isLargeModal,
        },
        className
      )}
    >
      {children}
    </div>
  )
}

Modal.Header = ({
  handleClose = undefined,
  children,
  canClose = true,
  isCenter = false,
}) => {
  const { onOutsideClick } = React.useContext(ModalContext)
  return (
    <div
      data-tauri-drag-region
      className="flex w-full items-center border-0 px-8 py-6 pb-2"
      onClick={e => {
        onOutsideClick && onOutsideClick()
        e.stopPropagation()
      }}
    >
      <div className={`flex flex-grow ${isCenter ? 'justify-center' : ''}`}>
        {children}
      </div>
      <div className="self-end">
        {handleClose && canClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="cursor-pointer border-0 p-1.5"
          >
            <X size={20} />
          </Button>
        )}
      </div>
    </div>
  )
}

Modal.Footer = ({ children, className }) => {
  const { isLargeModal, onOutsideClick } = React.useContext(ModalContext)

  return (
    <div
      data-tauri-drag-region
      onClick={e => {
        onOutsideClick && onOutsideClick()
        e.stopPropagation()
      }}
      className={clsx(
        'flex w-full px-7 pb-6 pt-2',
        {
          'border-grey-20 border-0 pt-4': isLargeModal,
        },
        className
      )}
    >
      {children}
    </div>
  )
}

export default Modal
