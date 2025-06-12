import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'
import { useTranslation } from 'react-i18next'
import { 
  Archive, 
  Download, 
  FolderOpen, 
  HardDrive, 
  Loader2, 
  Package, 
  RotateCcw, 
  Trash2, 
  Upload 
} from 'lucide-react'
import { useToast } from '~/components/ui/use-toast'
import AutoSize from 'react-virtualized-auto-sizer'

import Spacer from '~/components/atoms/spacer'
import { Icons } from '~/components/icons'
import SimpleBar from '~/components/libs/simplebar-react'
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
  TextNormal,
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

  const [includeImages, setIncludeImages] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [totalSize, setTotalSize] = useState('')
  const [isLoadingBackups, setIsLoadingBackups] = useState(false)

  const loadBackups = async () => {
    setIsLoadingBackups(true)
    try {
      const result = await invoke<BackupListResponse>('list_backups')
      setBackups(result.backups)
      setTotalSize(result.total_size_formatted)
    } catch (error) {
      console.error('Failed to load backups:', error)
      toast({
        title: t('Error', { ns: 'common' }),
        description: 'Failed to load backup list',
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
      const backupPath = await invoke<string>('create_backup', {
        includeImages,
      })
      
      toast({
        title: t('Backup created successfully', { ns: 'backuprestore' }),
        description: backupPath,
      })
      
      // Reload backup list
      await loadBackups()
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast({
        title: t('Error', { ns: 'common' }),
        description: `Failed to create backup: ${error}`,
        variant: 'destructive',
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backupPath: string, filename: string) => {
    setIsRestoring(true)
    try {
      await invoke('restore_backup', { backupPath })
      
      toast({
        title: t('Restore completed. The application will restart.', { ns: 'backuprestore' }),
        description: `Restored from ${filename}`,
      })
      
      // Application should restart after restore
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast({
        title: t('Error', { ns: 'common' }),
        description: `Failed to restore backup: ${error}`,
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleRestoreFromFile = async () => {
    try {
      const selectedFile = await invoke<string | null>('select_backup_file')
      
      if (selectedFile) {
        const filename = selectedFile.split(/[/\\]/).pop() || 'selected file'
        await handleRestoreBackup(selectedFile, filename)
      }
    } catch (error) {
      console.error('Failed to select backup file:', error)
      toast({
        title: t('Error', { ns: 'common' }),
        description: `Failed to select backup file: ${error}`,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteBackup = async (backupPath: string, filename: string) => {
    try {
      await invoke('delete_backup', { backupPath })
      
      toast({
        title: t('Backup deleted successfully', { ns: 'backuprestore' }),
        description: filename,
      })
      
      // Reload backup list
      await loadBackups()
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast({
        title: t('Failed to delete backup', { ns: 'backuprestore' }),
        description: `${error}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <Box className="w-full h-full">
      <AutoSize disableWidth>
        {({ height }) => (
          <SimpleBar style={{ height, width: '100%' }} autoHide>
            <Box className="flex flex-col gap-6 p-6">
              {/* Header */}
              <Box className="flex items-center gap-3">
                <Archive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <Text className="text-2xl font-semibold">
                  {t('Backup and Restore', { ns: 'backuprestore' })}
                </Text>
              </Box>

              {/* Create Backup Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    {t('Create Backup', { ns: 'backuprestore' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Flex className="items-center space-x-2">
                    <Checkbox
                      id="include-images"
                      checked={includeImages}
                      onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                    />
                    <label
                      htmlFor="include-images"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('Include images in backup', { ns: 'backuprestore' })}
                    </label>
                  </Flex>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isCreatingBackup} className="w-full">
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
                          {t('Create a backup of your data?', { ns: 'backuprestore' })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a backup file containing your database
                          {includeImages ? ' and images' : ''}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel', { ns: 'common' })}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreateBackup}>
                          {t('Create Backup', { ns: 'backuprestore' })}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              {/* Restore Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    {t('Restore Data', { ns: 'backuprestore' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={handleRestoreFromFile}
                    disabled={isRestoring}
                    className="w-full"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {t('Restore from File...', { ns: 'backuprestore' })}
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
                          {t('Total backup space: {{size}}', { 
                            ns: 'settings', 
                            size: totalSize 
                          })}
                        </Badge>
                      )}
                    </Flex>

                    {isLoadingBackups ? (
                      <Flex className="items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <Text className="ml-2">Loading backups...</Text>
                      </Flex>
                    ) : backups.length === 0 ? (
                      <Box className="text-center py-8 text-muted-foreground">
                        <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <Text>{t('No backups found', { ns: 'backuprestore' })}</Text>
                      </Box>
                    ) : (
                      <Box className="space-y-3">
                        {backups.map((backup) => (
                          <Card key={backup.filename} className="p-4">
                            <Flex className="items-center justify-between">
                              <Box className="flex-1">
                                <Flex className="items-center gap-2 mb-1">
                                  <Archive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <Text className="font-medium">{backup.filename}</Text>
                                </Flex>
                                <TextNormal className="text-sm text-muted-foreground">
                                  {t('Created', { ns: 'common' })}: {backup.created_date}
                                </TextNormal>
                                <TextNormal className="text-sm text-muted-foreground">
                                  {t('Size', { ns: 'common' })}: {backup.size_formatted}
                                </TextNormal>
                              </Box>
                              
                              <Flex className="gap-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      disabled={isRestoring}
                                    >
                                      <RotateCcw className="w-4 h-4 mr-1" />
                                      {t('Restore', { ns: 'backuprestore' })}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t('Restore from {{filename}}? This will replace all current data.', { 
                                          ns: 'settings', 
                                          filename: backup.filename 
                                        })}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. All current data will be replaced with the backup data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('Cancel', { ns: 'common' })}</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleRestoreBackup(backup.full_path, backup.filename)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {t('Restore', { ns: 'backuprestore' })}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t('Delete this backup? This action cannot be undone.', { ns: 'backuprestore' })}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {backup.filename} ({backup.size_formatted}) will be permanently deleted.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('Cancel', { ns: 'common' })}</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteBackup(backup.full_path, backup.filename)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {t('Delete', { ns: 'backuprestore' })}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Flex>
                            </Flex>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </SimpleBar>
        )}
      </AutoSize>
    </Box>
  )
}