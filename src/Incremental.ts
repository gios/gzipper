import { createReadStream } from 'node:fs'
import { lstat, readdir, unlink, rmdir, access } from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'
import deepEqual from 'deep-equal'

import { CACHE_FOLDER, CONFIG_FOLDER } from './constants'
import { Helpers } from './helpers'
import { Cache, IncrementalFileValue } from './interfaces'
import { Config } from './Config'

export class Incremental implements Cache {
  private readonly config!: Config
  private readonly _cacheFolder: string
  private _filePaths = new Map<string, IncrementalFileValue>()

  get cacheFolder(): string {
    return this._cacheFolder
  }

  get filePaths(): Record<string, IncrementalFileValue> {
    return Object.fromEntries(this._filePaths)
  }

  set filePaths(value: Record<string, IncrementalFileValue>) {
    this._filePaths = new Map(Object.entries(value))
  }

  /**
   * Creates an instance of Incremental.
   */
  constructor(config?: Config) {
    if (config) {
      this.config = config
    }
    this._cacheFolder = path.resolve(process.cwd(), CONFIG_FOLDER, CACHE_FOLDER)
  }

  /**
   * Read config (.gzipperconfig).
   */
  async readConfig(): Promise<void> {
    const incrementalConfig = this.config.configContent.incremental
    if (incrementalConfig) {
      this._filePaths = new Map(Object.entries(incrementalConfig.files))
    }
  }

  /**
   * update config (.gzipperconfig).
   */
  async updateConfig(): Promise<void> {
    this.config.setProperty('incremental', {
      files: Helpers.mapToJSON(this._filePaths),
    })
  }

  /**
   * Create cache folder (.gzipper).
   */
  async initCacheFolder(): Promise<void> {
    try {
      await access(this._cacheFolder)
    } catch {
      await Helpers.createFolders(this._cacheFolder)
    }
  }

  /**
   * Returns file incremental info and save checksum and options to `filePath` (if file is changed or newly created).
   */
  setFile(
    target: string,
    checksum: string,
    compressionType: string,
    compressOptions: IncrementalFileValue['revisions'][number]['options']
  ): {
    isChanged: boolean
    fileId: string
  } {
    const filePath = this._filePaths.get(target)
    const selectedRevision = filePath?.revisions.find(
      (revision) =>
        compressionType === revision.compressionType &&
        deepEqual(revision.options, compressOptions)
    )

    if (!filePath) {
      const fileId = crypto.randomUUID()
      this._filePaths.set(target, {
        revisions: [
          {
            lastChecksum: checksum,
            fileId,
            date: new Date(),
            compressionType,
            options: compressOptions,
          },
        ],
      })

      return {
        isChanged: true,
        fileId,
      }
    }

    if (!selectedRevision) {
      const fileId = crypto.randomUUID()
      this._filePaths.set(target, {
        revisions: filePath.revisions.concat({
          lastChecksum: checksum,
          fileId,
          date: new Date(),
          compressionType,
          options: compressOptions,
        }),
      })

      return {
        isChanged: true,
        fileId,
      }
    }

    if (selectedRevision.lastChecksum !== checksum) {
      this._filePaths.set(target, {
        revisions: filePath.revisions.map((revision) => {
          return revision.fileId === selectedRevision.fileId
            ? { ...revision, date: new Date(), lastChecksum: checksum }
            : revision
        }),
      })

      return {
        isChanged: true,
        fileId: selectedRevision.fileId,
      }
    }

    return {
      isChanged: false,
      fileId: selectedRevision.fileId,
    }
  }

  /**
   * Returns file checksum.
   */
  async getFileChecksum(target: string): Promise<string> {
    const hash = crypto.createHash('md5')
    const stream = createReadStream(target)

    return new Promise((resolve, reject) => {
      stream.on('data', (data: string) => hash.update(data, 'utf8'))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', (error: unknown) => reject(error))
    })
  }

  /**
   * Purge cache folder.
   */
  async cachePurge(): Promise<void> {
    try {
      await access(this._cacheFolder)
    } catch {
      throw new Error('No cache found.')
    }

    const recursiveRemove = async (
      folderPath = this._cacheFolder
    ): Promise<void> => {
      const files = await readdir(folderPath)

      for (const file of files) {
        const filePath = path.resolve(folderPath, file)
        const isDirectory = (await lstat(filePath)).isDirectory()

        if (isDirectory) {
          await recursiveRemove(filePath)
        } else {
          await unlink(filePath)
        }
      }

      await rmdir(folderPath)
    }

    await recursiveRemove()
    this.config.deleteProperty('incremental')
    await this.config.writeConfig()
  }

  /**
   * Returns cache size.
   */
  async cacheSize(folderPath = this._cacheFolder, size = 0): Promise<number> {
    try {
      await access(this._cacheFolder)
    } catch {
      throw new Error('No cache found.')
    }

    const files = await readdir(folderPath)

    if (!files.length) {
      return 0
    }

    for (const file of files) {
      const filePath = path.resolve(folderPath, file)
      const fileStat = await lstat(filePath)

      if (fileStat.isDirectory()) {
        size += await this.cacheSize(filePath, size)
      } else if (fileStat.isFile()) {
        size += fileStat.size
      }
    }
    return size
  }
}
