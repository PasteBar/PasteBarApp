import { useState } from 'react'
import { confirm } from '@tauri-apps/api/dialog'
import { CopyComponent } from '~/libs/bbcode'
import { settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { Check, Plus, Save, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import InputField from '~/components/molecules/input'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Flex,
  Switch,
  Text,
} from '~/components/ui'

interface NewTemplate {
  name: string
  value: string
}

export default function GlobalTemplatesSettings() {
  const { t } = useTranslation()
  const [isCreating, setIsCreating] = useState(false)
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({ name: '', value: '' })
  const [nameError, setNameError] = useState<string | null>(null)

  const {
    globalTemplatesEnabled,
    setGlobalTemplatesEnabled,
    globalTemplates,
    addGlobalTemplate,
    updateGlobalTemplate,
    deleteGlobalTemplate,
    toggleGlobalTemplateEnabledState,
  } = useAtomValue(settingsStoreAtom)

  const handleCreateTemplate = () => {
    if (newTemplate.name.trim() && newTemplate.value.trim()) {
      // Check for duplicate template name
      const isDuplicate = globalTemplates?.some(
        template => template.name.toLowerCase() === newTemplate.name.trim().toLowerCase()
      )

      if (isDuplicate) {
        setNameError(t('Template name already exists', { ns: 'templates' }))
        return
      }

      addGlobalTemplate({
        name: newTemplate.name.trim(),
        value: newTemplate.value.trim(),
      })
      setNewTemplate({ name: '', value: '' })
      setNameError(null)
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setNewTemplate({ name: '', value: '' })
    setNameError(null)
    setIsCreating(false)
  }

  return (
    <Box className="animate-in fade-in max-w-xl mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="animate-in fade-in text-md font-medium w-full">
            {t('globalTemplatesTitle', { ns: 'templates' })}
          </CardTitle>
          <Switch
            checked={globalTemplatesEnabled}
            className="ml-auto"
            onCheckedChange={setGlobalTemplatesEnabled}
          />
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">
            {t('globalTemplatesDescription', { ns: 'templates' })}
          </Text>

          {globalTemplatesEnabled && (
            <Box className="mt-4">
              {/* Existing Templates */}
              {globalTemplates && globalTemplates.length > 0 ? (
                <Box className="space-y-3 mb-4">
                  {globalTemplates.map(template => (
                    <Box
                      key={template.id}
                      className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50"
                    >
                      <Flex className="items-start gap-3">
                        <Box className="flex-1 space-y-2">
                          <InputField
                            small
                            disabled={true}
                            classNameInput="border-0 border-b border-gray-200 rounded-none pl-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                            label={t('templateNameLabel', { ns: 'templates' })}
                            value={template.name}
                            title={t('Template name cannot be changed after creation. Delete and recreate to change name.', { ns: 'templates' })}
                          />
                          <InputField
                            small
                            label={t('templateValueLabel', { ns: 'templates' })}
                            defaultValue={template.value}
                            classNameInput="border-0 border-b border-gray-200 rounded-none pl-1.5 bg-transparent dark:!text-slate-300"
                            onBlur={e =>
                              updateGlobalTemplate({
                                id: template.id,
                                value: e.target.value,
                              })
                            }
                          />
                        </Box>

                        <Flex className="flex-col items-center gap-2">
                          <Switch
                            title={t('Enable / Disable', { ns: 'common' })}
                            checked={template.isEnabled}
                            onCheckedChange={() =>
                              toggleGlobalTemplateEnabledState(template.id)
                            }
                          />
                        </Flex>
                      </Flex>

                      {template.name && (
                        <Flex className="mt-2 pt-1 justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 px-1.5 py-0.5"
                            title={t('deleteTemplateButtonTooltip', { ns: 'templates' })}
                            onClick={async () => {
                              const confirmed = await confirm(
                                t('confirmDeleteTemplateMessage', {
                                  ns: 'templates',
                                  name: template.name,
                                }),
                                {
                                  title: t('confirmDeleteTemplateTitle', {
                                    ns: 'templates',
                                  }),
                                  type: 'warning',
                                }
                              )
                              if (confirmed) {
                                deleteGlobalTemplate(template.id)
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <Box />
                          <Flex className="gap-2 items-center">
                            <Text className="text-xs text-muted-foreground">
                              {t('Template Usage', { ns: 'templates' })}:
                            </Text>
                            <CopyComponent
                              text={`{{${template.name}}}`}
                              copyText={`{{${template.name}}}`}
                              id={parseInt(template.id, 10)}
                            />
                          </Flex>
                        </Flex>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text className="text-sm text-muted-foreground mt-4 mb-4">
                  {t('noGlobalTemplatesYet', { ns: 'templates' })}
                </Text>
              )}

              {/* Create New Template Section */}
              {!isCreating ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                  className="w-full"
                >
                  <Plus size={16} className="mr-2" />
                  {t('addTemplateButton', { ns: 'templates' })}
                </Button>
              ) : (
                <Box className="p-4 border border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                  <Text className="text-sm font-medium mb-3 text-blue-800 dark:text-blue-200">
                    {t('Create New Template', { ns: 'templates' })}
                  </Text>

                  <Box className="space-y-3">
                    <InputField
                      small
                      label={t('templateNameLabel', { ns: 'templates' })}
                      placeholder={t('Enter template name (e.g., "signature", "email")', {
                        ns: 'templates',
                      })}
                      value={newTemplate.name}
                      onChange={e => {
                        setNewTemplate(prev => ({ ...prev, name: e.target.value }))
                        // Clear error when user types
                        if (nameError) setNameError(null)
                      }}
                      error={nameError as string}
                      autoFocus
                    />

                    <InputField
                      small
                      label={t('templateValueLabel', { ns: 'templates' })}
                      placeholder={t('Enter template content...', { ns: 'templates' })}
                      value={newTemplate.value}
                      onChange={e =>
                        setNewTemplate(prev => ({ ...prev, value: e.target.value }))
                      }
                    />

                    {newTemplate.name.trim() && (
                      <Box className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        <Text className="text-muted-foreground mb-1">
                          {t('Preview usage', { ns: 'templates' })}:
                        </Text>
                        <Text className="text-blue-600 dark:text-blue-400 text-sm">
                          {`{{${newTemplate.name.trim()}}}`}
                        </Text>
                      </Box>
                    )}

                    <Flex className="gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={handleCancelCreate}>
                        <X size={18} className="mr-1" />
                        {t('Cancel', { ns: 'common' })}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateTemplate}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-lg"
                        disabled={!newTemplate.name.trim() || !newTemplate.value.trim()}
                      >
                        <Check size={18} className="mr-1" />
                        {t('Create Template', { ns: 'templates' })}
                      </Button>
                    </Flex>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
