import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'
import { open } from '@tauri-apps/api/dialog'
import { type as getOsType } from '@tauri-apps/api/os'
import { settingsStoreAtom, uiStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import {
  Download,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Loader2,
  Package,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AutoSize from 'react-virtualized-auto-sizer'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { useToast } from '~/components/ui/use-toast'
import Spacer from '~/components/atoms/spacer'
import { TimeAgo } from '~/components/atoms/time-ago/TimeAgo'
import ToolTip from '~/components/atoms/tooltip'
import { Icons } from '~/components/icons'
import SimpleBar from '~/components/libs/simplebar-react'
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Flex,
  Text,
} from '~/components/ui'

interface BackupInfo {
  filename: string
  full_path: string
  created_date: string
  size: number
  size_formatted: string
}

interface BackupListResponse {
  backups: BackupInfo[]
  total_size: number
  total_size_formatted: string
}

export default function BackupRestoreSettings() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { returnRoute } = useAtomValue(uiStoreAtom)

  const { relaunchApp } = useAtomValue(settingsStoreAtom)

  const [includeImages, setIncludeImages] = useState(true)
  const [backupOnRestore, setBackupOnRestore] = useState(() => {
    const saved = localStorage.getItem('backupOnRestore')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Save backup on restore preference to localStorage
  useEffect(() => {
    localStorage.setItem('backupOnRestore', JSON.stringify(backupOnRestore))
  }, [backupOnRestore])
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoringFromFile, setRestoringFromFile] = useState(false)
  const [restoringBackupPath, setRestoringBackupPath] = useState<string | null>(null)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [totalSize, setTotalSize] = useState('')
  const [isLoadingBackups, setIsLoadingBackups] = useState(false)

  // Parse date from backup filename
  const parseBackupDate = (filename: string): Date | null => {
    // Extract date from filename format: pastebar-data-backup-YYYY-MM-DD-HH-MM.zip
    const match = filename.match(
      /pastebar-data-backup-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})\.zip/
    )
    if (match) {
      const [, year, month, day, hour, minute] = match
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      )
    }
    return null
  }

  const loadBackups = async () => {
    setIsLoadingBackups(true)
    try {
      const result = await invoke<BackupListResponse>('list_backups')
      setBackups(result.backups)
      setTotalSize(result.total_size_formatted)
    } catch (error) {
      console.error('Failed to load backups:', error)
      toast({
        id: 'backup-list-error',
        title: t('Error', { ns: 'common' }),
        duration: 3000,
        description: (
          <Box className="word-break">
            {t('Failed to load backup list', { ns: 'backuprestore' })}
          </Box>
        ),
        variant: 'destructive',
      })
    } finally {
      setIsLoadingBackups(false)
    }
  }

  useEffect(() => {
    loadBackups()
  }, [])

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      let backupPath = await invoke<string>('create_backup', {
        includeImages,
      })

      // Normalize path for Windows display
      const osType = await getOsType()
      if (osType === 'Windows_NT' && backupPath.startsWith('\\\\?\\')) {
        backupPath = backupPath.substring(4)
      }

      toast({
        id: 'backup-create-success',
        title: t('Backup created successfully', { ns: 'backuprestore' }),
        duration: 3000,
        description: <Box className="word-break">{backupPath}</Box>,
        variant: 'success',
      })

      // Reload backup list
      await loadBackups()
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast({
        id: 'backup-create-error',
        title: t('Error', { ns: 'common' }),
        duration: 3000,
        description: (
          <Box className="word-break">
            {t('Failed to create backup', { ns: 'backuprestore' })}: {String(error)}
          </Box>
        ),
        variant: 'destructive',
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backupPath: string, filename: string) => {
    setIsRestoring(true)
    setRestoringBackupPath(backupPath)
    try {
      await invoke('restore_backup', {
        backupPath,
        createPreRestoreBackup: backupOnRestore,
      })

      toast({
        id: 'backup-restore-success',
        title: t('Restore completed. The application will restart.', {
          ns: 'backuprestore',
        }),
        duration: 3000,
        description: (
          <Box className="word-break">
            {t('Restored from {{filename}}', { ns: 'backuprestore', filename })}
          </Box>
        ),
        variant: 'success',
      })

      setTimeout(() => {
        relaunchApp()
        setIsRestoring(false)
      }, 3000)

      // Application should restart after restore
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast({
        title: t('Error', { ns: 'common' }),
        id: 'backup-restore-error',
        duration: 3000,
        description: (
          <Box className="word-break">
            {t('Failed to restore backup', { ns: 'backuprestore' })}: {String(error)}
          </Box>
        ),
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(false)
      setRestoringBackupPath(null)
    }
  }

  const handleRestoreFromFile = async () => {
    try {
      setRestoringFromFile(true)
      // Get current data directory path for defaultPath
      const dataPaths = await invoke<{ data_dir: string }>('get_data_paths')

      const selected = await open({
        multiple: false,
        defaultPath: dataPaths.data_dir,
        filters: [
          {
            name: t('Backup Files', { ns: 'backuprestore' }),
            extensions: ['zip'],
          },
        ],
      })

      if (selected && typeof selected === 'string') {
        // Validate it's a valid backup file
        const filename =
          selected.split(/[/\\]/).pop() || t('selected file', { ns: 'backuprestore' })
        if (!filename.includes('pastebar-data-backup-') || !filename.endsWith('.zip')) {
          toast({
            id: 'backup-invalid-file',
            title: t('Invalid backup file', { ns: 'backuprestore' }),
            duration: 3000,
            description: (
              <Box className="word-break">
                {t('The selected file is not a valid PasteBar backup', {
                  ns: 'backuprestore',
                })}
              </Box>
            ),
            variant: 'destructive',
          })
          setRestoringFromFile(false)
          return
        }

        await handleRestoreBackup(selected, filename)
      }
      // If selected is null, user cancelled the dialog - no action needed
      setRestoringFromFile(false)
    } catch (error) {
      console.error('Failed to select backup file:', error)
      toast({
        title: t('Error', { ns: 'common' }),
        id: 'backup-select-error',
        duration: 3000,
        description: (
          <Box className="word-break">
            {t('Failed to select backup file', { ns: 'backuprestore' })}: {String(error)}
          </Box>
        ),
        variant: 'destructive',
      })
      setRestoringFromFile(false)
    }
  }

  const handleDeleteBackup = async (backupPath: string, filename: string) => {
    try {
      await invoke('delete_backup', { backupPath })

      toast({
        id: 'backup-delete-success',
        title: t('Backup deleted successfully', { ns: 'backuprestore' }),
        duration: 3000,
        description: <Box className="word-break">{filename}</Box>,
        variant: 'success',
      })

      // Reload backup list
      await loadBackups()
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast({
        id: 'backup-delete-error',
        title: t('Failed to delete backup', { ns: 'backuprestore' }),
        duration: 3000,
        description: <Box className="word-break">{`${error}`}</Box>,
        variant: 'destructive',
      })
    }
  }

  const handleBrowseBackupFolder = async (backupFilePath: string) => {
    try {
      let dirPath = ''
      const lastSlash = backupFilePath.lastIndexOf('/')
      const lastBackslash = backupFilePath.lastIndexOf('\\')
      const separatorIndex = Math.max(lastSlash, lastBackslash)

      if (separatorIndex > -1) {
        dirPath = backupFilePath.substring(0, separatorIndex)
      } else {
        console.error('Could not determine directory from backup path:', backupFilePath)
        toast({
          id: 'backup-open-error-no-dir',
          title: t('Error', { ns: 'common' }),
          duration: 3000,
          description: (
            <Box className="word-break">
              {t('Could not determine backup folder location from path {{path}}', {
                ns: 'backuprestore',
                path: backupFilePath,
              })}
            </Box>
          ),
          variant: 'destructive',
        })
        return
      }

      const osType = await getOsType()
      if (osType === 'Windows_NT' && dirPath.startsWith('\\\\?\\')) {
        dirPath = dirPath.substring(4)
      }

      if (!dirPath) {
        console.error('Derived directory path is empty for backup path:', backupFilePath)
        toast({
          id: 'backup-open-error-empty-dir',
          title: t('Error', { ns: 'common' }),
          duration: 3000,
          description: (
            <Box className="word-break">
              {t('Failed to derive a valid backup folder location.', {
                ns: 'backuprestore',
              })}
            </Box>
          ),
          variant: 'destructive',
        })
        return
      }

      await invoke('open_path_or_app', { path: dirPath })
    } catch (error) {
      console.error('Failed to open backup folder:', error)
      toast({
        id: 'backup-open-error', // Existing ID for this general error
        title: t('Error', { ns: 'common' }),
        duration: 3000,
        description: (
          <Box className="word-break">
            {t('Failed to open backup folder', { ns: 'backuprestore' })}: {String(error)}
          </Box>
        ),
        variant: 'destructive',
      })
    }
  }

  return (
    <AutoSize disableWidth>
      {({ height }) => {
        return (
          height && (
            <Box className="p-4 py-6 select-none min-w-[320px]">
              <Box className="text-xl my-2 mx-2 flex items-center justify-between">
                <Text className="light">
                  {t('Backup and Restore', { ns: 'backuprestore' })}
                </Text>
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
              </Box>
              <Spacer h={3} />
              <SimpleBar style={{ maxHeight: height - 85 }} autoHide={true}>
                <Box className="animate-in fade-in max-w-xl mt-4">
                  {/* Create Backup Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <Flex className="items-center gap-2">
                          <Upload className="w-5 h-5" />
                          {t('Create Backup', { ns: 'backuprestore' })}
                        </Flex>

                        {/* Include Images option - right corner */}
                        <Flex className="items-center text-sm">
                          <Checkbox
                            id="include-images"
                            checked={includeImages}
                            onChange={checked => setIncludeImages(checked as boolean)}
                          >
                            {t('Include images in backup', { ns: 'backuprestore' })}
                          </Checkbox>
                        </Flex>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={
                              isCreatingBackup || isRestoring || restoringFromFile
                            }
                            className="w-full"
                          >
                            {isCreatingBackup ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('Creating backup...', { ns: 'backuprestore' })}
                              </>
                            ) : (
                              <>
                                <Package className="w-4 h-4 mr-2" />
                                {t('Backup Now', { ns: 'backuprestore' })}
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('Create a backup of your data?', {
                                ns: 'backuprestore',
                              })}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                'This will create a backup file containing your database',
                                { ns: 'backuprestore' }
                              )}
                              {includeImages
                                ? t('and images', { ns: 'backuprestore' })
                                : ''}
                              .
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t('Cancel', { ns: 'common' })}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleCreateBackup}>
                              {t('Create Backup', { ns: 'backuprestore' })}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  {/* Restore Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <Flex className="items-center gap-2">
                          <Download className="w-5 h-5" />
                          {t('Restore Data', { ns: 'backuprestore' })}
                        </Flex>

                        <Flex className="items-center text-sm">
                          <Checkbox
                            id="backup-on-restore"
                            checked={backupOnRestore}
                            onChange={checked => setBackupOnRestore(checked as boolean)}
                          >
                            {t('Auto Backup on Restore', { ns: 'backuprestore' })}
                          </Checkbox>
                        </Flex>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        variant="outline"
                        onClick={handleRestoreFromFile}
                        disabled={isRestoring || restoringFromFile}
                        className="w-full"
                      >
                        {restoringFromFile ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('Restoring...', { ns: 'backuprestore' })}
                          </>
                        ) : (
                          <>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            {t('Restore from File...', { ns: 'backuprestore' })}
                          </>
                        )}
                      </Button>

                      <Spacer h={4} />

                      {/* Available Backups */}
                      <Box>
                        <Flex className="items-center justify-between mb-3">
                          <Text className="font-medium">
                            {t('Available Backups', { ns: 'backuprestore' })}
                          </Text>
                          {totalSize && (
                            <Badge variant="secondary">
                              {t('Total backup space {{size}}', {
                                ns: 'backuprestore',
                                size: totalSize,
                              })}
                            </Badge>
                          )}
                        </Flex>

                        {isLoadingBackups ? (
                          <Flex className="items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <Text className="ml-2">
                              {t('Loading backups...', { ns: 'backuprestore' })}
                            </Text>
                          </Flex>
                        ) : backups.length === 0 ? (
                          <Box className="text-center py-8 text-muted-foreground">
                            <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <Text>{t('No backups found', { ns: 'backuprestore' })}</Text>
                          </Box>
                        ) : (
                          <Box className="space-y-3">
                            {backups.map(backup => {
                              const backupDate = parseBackupDate(backup.filename)
                              return (
                                <Card key={backup.filename} className="p-4">
                                  <Box className="space-y-3">
                                    {/* File name - bold on top */}
                                    <Text className="font-bold text-lg">
                                      {backup.filename}
                                    </Text>

                                    {/* Date and size line */}
                                    <Flex className="items-center justify-between text-sm text-muted-foreground">
                                      <Flex className="items-center gap-2">
                                        {backupDate ? (
                                          <TimeAgo date={backupDate.getTime()} />
                                        ) : (
                                          <span>{backup.created_date}</span>
                                        )}
                                      </Flex>
                                      <span>{backup.size_formatted}</span>
                                    </Flex>

                                    {/* Buttons row */}
                                    <Flex className="items-center justify-between">
                                      {/* Delete button on the left */}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <ToolTip
                                            side="bottom"
                                            text={t('Delete', { ns: 'backuprestore' })}
                                          >
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                              disabled={isRestoring || restoringFromFile}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </ToolTip>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              {t(
                                                'Delete this backup? This action cannot be undone.',
                                                { ns: 'backuprestore' }
                                              )}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              {backup.filename} ({backup.size_formatted})
                                              {t('will be permanently deleted.', {
                                                ns: 'backuprestore',
                                              })}
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              {t('Cancel', { ns: 'common' })}
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                handleDeleteBackup(
                                                  backup.full_path,
                                                  backup.filename
                                                )
                                              }
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              {t('Delete', { ns: 'backuprestore' })}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>

                                      {/* Browse and Restore buttons on the right */}
                                      <Flex className="gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleBrowseBackupFolder(backup.full_path)
                                          }
                                          disabled={isRestoring || restoringFromFile}
                                        >
                                          <ExternalLink className="w-4 h-4 mr-1" />
                                          {t('Browse', { ns: 'backuprestore' })}
                                        </Button>

                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              disabled={isRestoring || restoringFromFile}
                                            >
                                              {restoringBackupPath ===
                                              backup.full_path ? (
                                                <>
                                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                  {t('Restoring...', {
                                                    ns: 'backuprestore',
                                                  })}
                                                </>
                                              ) : (
                                                <>
                                                  <RotateCcw className="w-4 h-4 mr-1" />
                                                  {t('Restore', { ns: 'backuprestore' })}
                                                </>
                                              )}
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                {t(
                                                  'Restore from {{filename}}? This will replace all current data.',
                                                  {
                                                    ns: 'backuprestore',
                                                    filename: backup.filename,
                                                  }
                                                )}
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                {t(
                                                  'This action cannot be undone. All current data will be replaced with the backup data.',
                                                  { ns: 'backuprestore' }
                                                )}
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                {t('Cancel', { ns: 'common' })}
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleRestoreBackup(
                                                    backup.full_path,
                                                    backup.filename
                                                  )
                                                }
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                {t('Restore', { ns: 'backuprestore' })}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </Flex>
                                    </Flex>
                                  </Box>
                                </Card>
                              )
                            })}
                          </Box>
                        )}
                      </Box>

                      {/* Restore note */}
                      <Text className="text-xs text-muted-foreground mt-2">
                        {t(
                          'Restoring a backup will automatically restart the application.',
                          { ns: 'backuprestore' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>

                  <Spacer h={6} />
                  <Link to={returnRoute} replace>
                    <Button
                      variant="ghost"
                      className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                      size="sm"
                    >
                      {t('Back', { ns: 'common' })}
                    </Button>
                  </Link>
                  <Spacer h={4} />
                </Box>
              </SimpleBar>
            </Box>
          )
        )
      }}
    </AutoSize>
  )
}
