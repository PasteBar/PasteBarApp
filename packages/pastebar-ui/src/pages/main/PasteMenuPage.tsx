import { useEffect, useRef } from 'react'
import { MainContainer } from '~/layout/Layout'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Box, Flex, Text } from '~/components/ui'

import {
  useGetCollections,
  useGetCollectionWithClips,
} from '~/hooks/queries/use-collections'

export default function PasteMenuPage() {
  useGetCollections()
  useGetCollectionWithClips()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const scollToRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scollToRef?.current) {
      scollToRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }, [scollToRef?.current])

  return (
    <MainContainer>
      <Box className="h-[calc(100vh-70px)] flex flex-col bg-slate-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.8] pb-4 pt-4 px-3 pr-3">
        <Box className="flex flex-col h-[calc(100vh-95px)] relative">
          <Flex className="flex items-center flex-col gap-3 justify-center">
            <Text className="animate-in fill-mode-forwards fade-in text-slate-300 text-xs bg-slate-100 rounded-full px-3 dark:text-slate-600 dark:bg-slate-900">
              {t('No Menu Items', { ns: 'menus' })}
            </Text>
          </Flex>

          <Box className="flex-1 mt-3" />
          <Tabs
            className="min-w-full flex flex-row justify-center h-10 items-center gap-2"
            value={location.pathname}
            onValueChange={pathname => {
              navigate(pathname, { replace: true })
            }}
          >
            <TabsList className="self-center">
              <TabsTrigger value="/history">
                {t('Clipboard History', { ns: 'common' })}
              </TabsTrigger>
              <TabsTrigger value="/menu">{t('Paste Menu', { ns: 'common' })}</TabsTrigger>
            </TabsList>
          </Tabs>
        </Box>
      </Box>
    </MainContainer>
  )
}
