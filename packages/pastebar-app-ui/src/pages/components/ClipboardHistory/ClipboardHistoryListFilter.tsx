import { ReactNode, useEffect } from 'react'
import { uiStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { FunctionSquare, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import SimpleBar from '~/components/libs/simplebar-react'
import { Badge, Box, CheckBoxFilter, Flex, Shortcut, Text } from '~/components/ui'

export const HISTORY_FILTERS = {
  STARRED: 'starred',
  PINNED: 'pinned',
  TEXT: 'text',
  LINK: 'link',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  EMOJI: 'emoji',
  SECRET: 'secret',
  CODE: 'code',
} as const

type ClipboardHistoryListFilterProps = {
  historyFilters: string[]
  codeFilters: string[]
  setCodeFilters: (filters: string[]) => void
  children?: ReactNode
  avaliableCodeLanguages: string[]
  setHistoryFilters: (filters: string[]) => void
}

export const ClipboardHistoryListFilter = ({
  historyFilters,
  setHistoryFilters,
  codeFilters,
  avaliableCodeLanguages,
  setCodeFilters,
  children,
}: ClipboardHistoryListFilterProps) => {
  const { t } = useTranslation()
  const changeFilter = (filter: string, only?: boolean) => {
    if (only) {
      setHistoryFilters([filter])
      return
    }
    if (historyFilters.includes(filter)) {
      setHistoryFilters(historyFilters.filter(f => f !== filter))
    } else {
      setHistoryFilters([...historyFilters, filter])
    }
  }

  const changeCodeFilter = (filter: string, only?: boolean) => {
    if (only) {
      setCodeFilters([filter])
      return
    }

    if (codeFilters.includes(filter)) {
      setCodeFilters(codeFilters.filter(f => f !== filter))
    } else {
      setCodeFilters([...codeFilters, filter])
    }
  }

  useEffect(() => {
    if (!historyFilters.includes(HISTORY_FILTERS.CODE)) {
      setCodeFilters([])
    }
  }, [historyFilters])

  const { isSwapPanels } = useAtomValue(uiStoreAtom)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" sideOffset={12} align="center">
        <DropdownMenuItem
          className="text-center items-center justify-center py-0.5"
          disabled={!historyFilters.length}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            setHistoryFilters([])
          }}
        >
          {!historyFilters.length ? (
            <Text>{t('Filters:::Select Filters', { ns: 'history' })}</Text>
          ) : (
            <Flex className="justify-between items-center w-full">
              <Box className="w-6 h-4"></Box>
              <Text>{t('Filters:::Clear Filters', { ns: 'history' })}</Text>
              <X className="w-6 h-4" />
            </Flex>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {Object.values(HISTORY_FILTERS).map((filter, i) => (
          <Box key={filter}>
            {i === 2 && <DropdownMenuSeparator key="separator" />}
            <DropdownMenuItem
              onClick={e => {
                e.preventDefault()
                changeFilter(filter)
              }}
            >
              <CheckBoxFilter
                label={t(`Filters:::${capitalizeFirstLetter(filter)}`, { ns: 'history' })}
                checked={historyFilters.includes(filter)}
              />
              <DropdownMenuShortcut>
                <Box
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    changeFilter(filter, true)
                  }}
                  className="cursor-pointer hover:underline"
                >
                  <Shortcut keys={t('only', { ns: 'common' })} />
                </Box>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </Box>
        ))}
        {historyFilters.includes(HISTORY_FILTERS.CODE) && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger noRightIcon={isSwapPanels} disabled={false}>
              <FunctionSquare className="mr-2 h-4 w-4" />
              <Text>{t('Filters:::Language Filters', { ns: 'history' })}</Text>
              {codeFilters.length > 0 && (
                <Badge className="ml-auto py-0">{codeFilters.length}</Badge>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem
                className="text-center items-center justify-center py-0.5"
                disabled={!codeFilters.length}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCodeFilters([])
                }}
              >
                {!codeFilters.length ? (
                  <Text>{t('Filters:::Language Filters', { ns: 'history' })}</Text>
                ) : (
                  <Flex className="justify-between items-center w-full">
                    <Box className="w-6 h-4"></Box>
                    <Text>{t('Filters:::Clear Filters', { ns: 'history' })}</Text>
                    <X className="w-6 h-4" />
                  </Flex>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SimpleBar
                className="code-filter"
                style={{ height: 'auto', maxHeight: '190px' }}
                autoHide={false}
              >
                {avaliableCodeLanguages.map(filter => (
                  <DropdownMenuItem
                    key={filter}
                    onClick={e => {
                      e.preventDefault()
                      changeCodeFilter(filter)
                    }}
                  >
                    <CheckBoxFilter
                      label={filter}
                      checked={codeFilters.includes(filter)}
                    />
                    <DropdownMenuShortcut>
                      <Box
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          changeCodeFilter(filter, true)
                        }}
                        className="cursor-pointer hover:underline"
                      >
                        <Shortcut keys="only" />
                      </Box>
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </SimpleBar>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
