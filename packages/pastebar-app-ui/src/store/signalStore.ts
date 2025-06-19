import { UniqueIdentifier } from '@dnd-kit/core'
import { computed, effect, signal, Signal } from '@preact/signals-react'
import { emit, listen } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'

import { compareIdArrays } from '~/lib/utils'

import { CreateDashboardItemType, CreateMenuItem } from '~/types/menu'

import { ACTION_TYPE_COMFIRMATION_MODAL, APP_TOURS } from './constants'
import { Song, SongSourceType } from './playerStore'

type ValueOf<T> = T[keyof T]
export type ActionType = ValueOf<typeof ACTION_TYPE_COMFIRMATION_MODAL>
export type AppTourType = ValueOf<typeof APP_TOURS>

export const visibilityCopyPopup = signal(false)
export const openAddSelectedTextModal = signal(false)

export const recentSearchTerm = signal<string | null>(null)
export const isAppLocked = signal(false)
export const isWindowsOS = signal(false)
export const resetPassCodeNextDelayInSeconds = signal<number>(0)
export const resetPassCodeNumberOfTried = signal<number>(0)
export const openActionConfirmModal = signal(false)
export const openAboutPasteBarModal = signal(false)
export const openContactUsFormModal = signal(false)
export const openOnBoardingTourName = signal<AppTourType | null>(null)
export const openProtectedContentModal = signal(false)
export const pendingProtectedCollectionId = signal<string | null>(null)
export const onBoardingTourSingleElements = signal<string | string[] | null>(null)
export const openOSXSystemPermissionsModal = signal(false)
export const actionNameForConfirmModal = signal<string | null>(null)
export const actionTypeForConfirmModal = signal<ActionType | null>(null)
export const actionTypeConfirmed = signal<ActionType | null>(null)
export const resetTimeModalInterval = signal<NodeJS.Timeout | null>(null)

// Clipboard History Signals
export const showHistoryDeleteConfirmationId = signal<UniqueIdentifier | null>(null)
export const hoveringHistoryRowId = signal<UniqueIdentifier | null>(null)
export const showLargeViewHistoryId = signal<UniqueIdentifier | null>(null)
export const isHistoryCopyPasting = signal(false)

// Tabs Dashboard Signals
export const showEditTabs = signal(false)

// Clip Dashboard Signals
export const showDetailsClipId = signal<UniqueIdentifier | null>(null)
export const showOrganizeLayout = signal(false)
export const showClipsMoveOnBoardId: Signal<UniqueIdentifier | null> = signal(null)
export const showClipFindKeyPressed = signal(false)
export const isClipNameEditing = signal(false)
export const forceSaveEditClipName = signal(false)
export const forceSaveClipNameEditingError = signal(false)
export const hoveringClipIdBoardId = signal<string | null>(null)
export const showDeleteClipConfirmationId = signal<UniqueIdentifier | null>(null)
export const contextMenuClipId = signal<UniqueIdentifier | null>(null)
export const showDeleteImageClipConfirmationId = signal<UniqueIdentifier | null>(null)
export const isDeletingSelectedClips = signal(false)
export const addSelectedTextToClipBoard = signal<string | null>(null)

export const showEditClipId: Signal<UniqueIdentifier | null> = signal(null)
export const showEditClipNameId: Signal<UniqueIdentifier | null> = signal(null)
export const showLargeViewClipId: Signal<UniqueIdentifier | null> = signal(null)
export const hasDashboardItemCreate: Signal<CreateDashboardItemType | null> = signal(null)
export const newBoardItemId: Signal<UniqueIdentifier | null> = signal(null)
export const newClipItemId: Signal<UniqueIdentifier | null> = signal(null)
export const createClipBoardItemId: Signal<UniqueIdentifier | null> = signal(null)
export const createBoardItemId: Signal<UniqueIdentifier | null> = signal(null)
export const creatingClipItemBoardId: Signal<UniqueIdentifier | null> = signal(null)
export const createClipHistoryItemIds: Signal<UniqueIdentifier[] | null> = signal(null)
export const editBoardItemId: Signal<UniqueIdentifier | null> = signal(null)
export const editClipItemId: Signal<UniqueIdentifier | null> = signal(null)
export const activeOverTabId: Signal<UniqueIdentifier | null> = signal(null)

export const dragClipHeight: Signal<number | null> = signal(null)
export const dragClipWidth: Signal<number | null> = signal(null)

// Board Signals
export const showDeleteBoardConfirmationId = signal<UniqueIdentifier | null>(null)
export const showExpandViewBoardId: Signal<UniqueIdentifier | null> = signal(null)
export const isFullyExpandViewBoard = signal(false)
export const createFirstBoard = signal(false)
export const isBoardNameEditing = signal(false)
export const showBoardNameNotSavedError = signal(false)
export const highLightBoardId = signal<UniqueIdentifier | null>(null)

// Menu Signals
export const isHoveringMenuId = signal<string | null>(null)
export const newMenuItemId = signal<string | null>(null)
export const addSelectedTextToMenu = signal<string | null>(null)
export const showLinkedClipId = signal<UniqueIdentifier | null>(null)
export const showLinkedMenuId = signal<string | null>(null)
export const showDeleteMenuConfirmationId = signal<UniqueIdentifier | null>(null)
export const createMenuItemFromHistoryId = signal<string | null>(null)
export const createMenuItemFromClipId = signal<UniqueIdentifier | null>(null)
export const creatingNewMenuItem = signal<CreateMenuItem | null>(null)
export const isCreatingMenuItem = signal(false)
export const showEditMenuItemId = signal<string | null>(null)
export const showDeleteMenuItemsConfirmation = signal(false)
export const isMenuNameEditing = signal(false)
export const showMenuNameNotSavedError = signal(false)
export const creatingMenuItemCurrentMenuId = signal(false)

export const isNavBarHovering = signal(false)

// Keyboard Navigation Signals for Board/History Context
export const currentNavigationContext = signal<'history' | 'board' | null>(null)
export const currentBoardIndex = signal<number>(0)
export const keyboardSelectedItemId = signal<UniqueIdentifier | null>(null)
export const keyboardSelectedClipId = signal<UniqueIdentifier | null>(null)
export const keyboardSelectedBoardId = signal<UniqueIdentifier | null>(null)

export function closeEdit() {
  showDeleteClipConfirmationId.value = null
  editBoardItemId.value = null
  hoveringClipIdBoardId.value = null
  newBoardItemId.value = null
  newClipItemId.value = null
  showEditClipId.value = null
  isClipNameEditing.value = false
  showEditClipNameId.value = null
  isBoardNameEditing.value = false
  showBoardNameNotSavedError.value = false
  creatingClipItemBoardId.value = null
  createClipBoardItemId.value = null
  createClipHistoryItemIds.value = null
}

export function resetMenuCreateOrEdit() {
  showDeleteMenuConfirmationId.value = null
  showLinkedClipId.value = null
  showDeleteMenuItemsConfirmation.value = false
  creatingNewMenuItem.value = null
  newMenuItemId.value = null
  showEditMenuItemId.value = null
  isMenuNameEditing.value = false
  showMenuNameNotSavedError.value = false
  creatingMenuItemCurrentMenuId.value = false
  if (createMenuItemFromHistoryId.value || createMenuItemFromClipId.value) {
    isCreatingMenuItem.value = false
  }
}

export function resetKeyboardNavigation() {
  currentNavigationContext.value = null
  keyboardSelectedItemId.value = null
  hoveringHistoryRowId.value = null
  keyboardSelectedBoardId.value = null
  keyboardSelectedClipId.value = null
  currentBoardIndex.value = 0
}

export const showInvalidTrackWarningAddSong: Signal<{
  songUrl: string
  id: UniqueIdentifier
  isFile?: boolean
  sourceType: SongSourceType
  play: boolean
  name?: string
} | null> = signal(null)

// Keyboard Shortcuts Signals
export const isKeyAltPressed: Signal<boolean> = signal(false)
export const isKeyCtrlPressed: Signal<boolean> = signal(false)
export const isEscPressed: Signal<boolean> = signal(false)

// Application Update Signals
export const availableVersionNumber = signal<string | null>(null)
export const availableVersionDate = signal<string | null>(null)
export const availableVersionDateISO = signal<string | null>(null)
export const availableVersionBody = signal<string | null>(null)
export const showUpdateAvailable = signal(false)
export const showUpdateAppIsLatest = signal(false)
export const showUpdateChecking = signal(false)
export const showUpdateError = signal(false)
export const showUpdateErrorQuitAppToFinish = signal(false)
export const showUpdateErrorDownloadError = signal(false)
export const showUpdateErrorDownloadingUpdate = signal(false)
export const showUpdateInstalling = signal(false)
export const showUpdateErrorPermissionDenied = signal(false)
export const showRestartAfterUpdate = signal(false)

export const shouldKeyboardNavigationBeDisabled = signal(false)

// Computed signal for all modal and confirmation dialog states
export const isAnyModalOpen = computed(
  () =>
    // Modal states
    openActionConfirmModal.value ||
    openAboutPasteBarModal.value ||
    openContactUsFormModal.value ||
    openOSXSystemPermissionsModal.value ||
    showInvalidTrackWarningAddSong.value ||
    // Confirmation dialogs
    showHistoryDeleteConfirmationId.value !== null ||
    showDeleteClipConfirmationId.value !== null ||
    showDeleteBoardConfirmationId.value !== null ||
    showDeleteImageClipConfirmationId.value !== null ||
    showDeleteMenuConfirmationId.value !== null ||
    showDeleteMenuItemsConfirmation.value ||
    // Onboarding tour
    openOnBoardingTourName.value !== null ||
    visibilityCopyPopup.value ||
    openAddSelectedTextModal.value
)

effect(() => {
  if (
    // Existing editing states
    showEditClipId.value ||
    newClipItemId.value ||
    showEditTabs.value ||
    newBoardItemId.value ||
    editClipItemId.value ||
    showEditClipNameId.value ||
    showOrganizeLayout.value ||
    showEditMenuItemId.value ||
    isCreatingMenuItem.value ||
    // Global editing states
    isClipNameEditing.value ||
    isBoardNameEditing.value ||
    isMenuNameEditing.value ||
    // Modal states
    isAnyModalOpen.value ||
    // Creating/creation states
    createClipBoardItemId.value ||
    createBoardItemId.value ||
    creatingClipItemBoardId.value ||
    createClipHistoryItemIds.value ||
    creatingMenuItemCurrentMenuId.value ||
    creatingNewMenuItem.value ||
    createMenuItemFromHistoryId.value ||
    createMenuItemFromClipId.value ||
    // Error/validation states
    forceSaveEditClipName.value ||
    forceSaveClipNameEditingError.value ||
    showBoardNameNotSavedError.value ||
    showMenuNameNotSavedError.value ||
    // App security state
    isAppLocked.value ||
    // Additional menu states
    newMenuItemId.value ||
    addSelectedTextToMenu.value ||
    // Text selection states
    addSelectedTextToClipBoard.value
  ) {
    // console.log('Disabling keyboard navigation due to edit or delete actions')
    // Disable keyboard navigation when editing
    shouldKeyboardNavigationBeDisabled.value = true
    resetKeyboardNavigation()
  } else {
    // console.log('Enabling keyboard navigation')
    shouldKeyboardNavigationBeDisabled.value = false
  }
})

if (!window.isQuickPasteWindow) {
  effect(() => {
    emit('signal-store-sync', {
      signal: 'showLargeViewHistoryId',
      value: showLargeViewHistoryId.value,
    })
  })

  effect(() => {
    emit('signal-store-sync', {
      signal: 'hasDashboardItemCreate',
      value: hasDashboardItemCreate.value,
    })
  })

  effect(() => {
    emit('signal-store-sync', {
      signal: 'createClipHistoryItemIds',
      value: createClipHistoryItemIds.value,
    })
  })

  effect(() => {
    emit('signal-store-sync', {
      signal: 'createMenuItemFromHistoryId',
      value: createMenuItemFromHistoryId.value,
    })
  })

  effect(() => {
    emit('signal-store-sync', {
      signal: 'isCreatingMenuItem',
      value: isCreatingMenuItem.value,
    })
  })

  effect(() => {
    emit('signal-store-sync', {
      signal: 'isAppLocked',
      value: isAppLocked.value,
    })
  })
}

export const listenToSignalStoreEvents = listen('signal-store-sync', async event => {
  const { payload } = event
  const { signal, value } = payload as {
    signal: string
    value:
      | string
      | boolean
      | number
      | null
      | UniqueIdentifier
      | UniqueIdentifier[]
      | CreateDashboardItemType
  }
  if (
    (window.isHistoryWindow && event.windowLabel !== 'history') ||
    (window.isMainWindow && event.windowLabel !== 'main')
  ) {
    if (signal === 'showLargeViewHistoryId' && showLargeViewHistoryId.value !== value) {
      if (window.isMainWindow) {
        emit('navigate-main', {
          location: '/history',
        })
        const isVisible = await appWindow.isVisible()
        if (!isVisible) {
          // appWindow.show()
        }
      }

      showLargeViewHistoryId.value = value as UniqueIdentifier | null
      return
    }
    if (signal === 'hasDashboardItemCreate' && hasDashboardItemCreate.value !== value) {
      hasDashboardItemCreate.value = value as CreateDashboardItemType | null
      return
    }

    if (
      signal === 'createClipHistoryItemIds' &&
      !compareIdArrays(createClipHistoryItemIds.value, value as UniqueIdentifier[] | null)
    ) {
      console.log('createClipHistoryItemIds.value', createClipHistoryItemIds.value)
      if (window.isMainWindow) {
        const isVisible = await appWindow.isVisible()
        if (!isVisible) {
          appWindow.show()
          appWindow.setFocus()
        }
      }
      createClipHistoryItemIds.value = value as UniqueIdentifier[] | null
      return
    }

    if (signal === 'isCreatingMenuItem' && isCreatingMenuItem.value !== value) {
      isCreatingMenuItem.value = value as boolean
      return
    }

    if (
      signal === 'createMenuItemFromHistoryId' &&
      createMenuItemFromHistoryId.value !== value
    ) {
      if (window.isMainWindow) {
        const isVisible = await appWindow.isVisible()
        if (!isVisible) {
          appWindow.show()
          appWindow.setFocus()
        }
        createMenuItemFromHistoryId.value = value as string | null
      }

      return
    }

    if (signal === 'isAppLocked' && isAppLocked.value !== value) {
      isAppLocked.value = value as boolean

      return
    }
  }
})
