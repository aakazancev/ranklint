import { inflateRawSync } from 'node:zlib'
import type { Report, ReportStorage } from '@ranklint/core'

export interface GithubStorageOptions {
  apiUrl?: string
  repository?: string
  token?: string
  artifactName?: string
  artifactPath?: string
}

const EOCD_SIGNATURE = 0x06054B50
const CENTRAL_SIGNATURE = 0x02014B50

export function unzipFile(zip: Buffer, fileName: string): Buffer | null {
  try {
    return unzipFileUnsafe(zip, fileName)
  } catch {
    return null
  }
}

function unzipFileUnsafe(zip: Buffer, fileName: string): Buffer | null {
  let eocd = -1
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i
      break
    }
  }
  if (eocd === -1) return null
  const entryCount = zip.readUInt16LE(eocd + 10)
  let offset = zip.readUInt32LE(eocd + 16)
  for (let i = 0; i < entryCount; i++) {
    if (zip.readUInt32LE(offset) !== CENTRAL_SIGNATURE) return null
    const nameLength = zip.readUInt16LE(offset + 28)
    const extraLength = zip.readUInt16LE(offset + 30)
    const commentLength = zip.readUInt16LE(offset + 32)
    const name = zip.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    if (name === fileName) {
      const method = zip.readUInt16LE(offset + 10)
      const localOffset = zip.readUInt32LE(offset + 42)
      const localNameLength = zip.readUInt16LE(localOffset + 26)
      const localExtraLength = zip.readUInt16LE(localOffset + 28)
      const dataStart = localOffset + 30 + localNameLength + localExtraLength
      const compressedSize = zip.readUInt32LE(offset + 20)
      const data = zip.subarray(dataStart, dataStart + compressedSize)
      if (method === 0) return Buffer.from(data)
      if (method === 8) return inflateRawSync(data)
      return null
    }
    offset += 46 + nameLength + extraLength + commentLength
  }
  return null
}

interface ArtifactList {
  artifacts?: {
    id: number
    name: string
    expired: boolean
    archive_download_url: string
    workflow_run?: { head_branch?: string }
  }[]
}

export class GithubArtifactsStorage implements ReportStorage {
  private apiUrl: string
  private repository: string
  private token: string | undefined
  private artifactName: string
  private artifactPath: string

  constructor(options: GithubStorageOptions = {}) {
    this.apiUrl = options.apiUrl ?? process.env.GITHUB_API_URL ?? 'https://api.github.com'
    this.repository = options.repository ?? process.env.GITHUB_REPOSITORY ?? ''
    this.token = options.token ?? process.env.RANKLINT_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN
    this.artifactName = options.artifactName ?? process.env.RANKLINT_ARTIFACT_NAME ?? 'ranklint-report'
    this.artifactPath = options.artifactPath ?? 'ranklint-report.json'
    if (!this.repository) {
      throw new Error('GitHub storage needs GITHUB_REPOSITORY (or explicit options)')
    }
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json' }
    if (this.token) headers.authorization = `Bearer ${this.token}`
    return headers
  }

  async save(): Promise<void> {
    throw new Error('GithubArtifactsStorage is read-only: publish reports with actions/upload-artifact')
  }

  async load(ref: string): Promise<Report | null> {
    const url = `${this.apiUrl}/repos/${this.repository}/actions/artifacts`
      + `?name=${encodeURIComponent(this.artifactName)}&per_page=100`
    const res = await fetch(url, { headers: this.headers() })
    if (!res.ok) throw new Error(`GitHub artifacts API responded ${res.status}`)
    const { artifacts = [] } = await res.json() as ArtifactList
    const match = [...artifacts]
      .sort((a, b) => b.id - a.id)
      .find(artifact => !artifact.expired && (ref === '' || artifact.workflow_run?.head_branch === ref))
    if (!match) return null
    const zipRes = await fetch(match.archive_download_url, { headers: this.headers(), redirect: 'follow' })
    if (!zipRes.ok) throw new Error(`GitHub artifact download responded ${zipRes.status}`)
    const zip = Buffer.from(await zipRes.arrayBuffer())
    const file = unzipFile(zip, this.artifactPath)
    if (!file) return null
    return JSON.parse(file.toString('utf8')) as Report
  }

  latest(): Promise<Report | null> {
    return this.load('')
  }
}
