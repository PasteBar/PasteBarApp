'use client'

import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api'
import { themeStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'

import {
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from '~/components/ui/menubar'
import { Icons } from '~/components/icons'

export function ThemeModeToggle() {
  const { t } = useTranslation()
  const { setTheme, theme } = useTheme()
  const { mode, setMode } = useAtomValue(themeStoreAtom)

  useEffect(() => {
    if (theme !== mode) {
      setMode(theme)
    }
  }, [theme])

  const themeIcon =
    theme === 'light' ? (
      <Icons.sun size={14} className="ml-2" />
    ) : theme === 'dark' ? (
      <Icons.moon size={14} className="ml-2" />
    ) : (
      <Icons.sunmoon width={12} height={12} className="ml-2" />
    )

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        {t('Color Theme', { ns: 'navbar' })} {themeIcon}
      </MenubarSubTrigger>
      <MenubarSubContent>
        {/* <MenubarRadioGroup value={theme}> */}
        <MenubarCheckboxItem
          checked={theme === 'light'}
          onClick={() => setTheme('light')}
        >
          <span className="flex tems-end">
            <Icons.sun className="mr-2" size={17} />
          </span>
          <span>{t('Theme:::Light', { ns: 'navbar' })}</span>
        </MenubarCheckboxItem>
        <MenubarCheckboxItem checked={theme === 'dark'} onClick={() => setTheme('dark')}>
          <span className="flex items-end">
            <Icons.moon className="mr-2" size={15} />
          </span>
          <span>{t('Theme:::Dark', { ns: 'navbar' })}</span>
        </MenubarCheckboxItem>
        <MenubarCheckboxItem
          checked={theme === 'system'}
          onClick={() => setTheme('system')}
        >
          <span className="flex w-[1.5rem] items-end">
            <Icons.sunmoon className="mr-2" width={13} height={13} />
          </span>
          <span>{t('Theme:::System', { ns: 'navbar' })}</span>
        </MenubarCheckboxItem>
        {/* </MenubarRadioGroup> */}
      </MenubarSubContent>
    </MenubarSub>
  )
}
