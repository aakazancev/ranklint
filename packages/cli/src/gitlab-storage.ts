import type { Report, ReportStorage } from '@ranklint/core'

export interface GitlabStorageOptions {
  apiUrl?: string
  projectId?: string
  token?: string
  job?: string
  artifactPath?: string
}

export class GitlabArtifactsStorage implements ReportStorage {
  private apiUrl: string
  private projectId: string
  private token: string | undefined
  private job: string
  private artifactPath: string

  constructor(options: GitlabStorageOptions = {}) {
    this.apiUrl = options.apiUrl ?? process.env.CI_API_V4_URL ?? ''
    this.projectId = options.projectId ?? process.env.CI_PROJECT_ID ?? ''
    this.token = options.token ?? process.env.RANKLINT_GITLAB_TOKEN ?? process.env.CI_JOB_TOKEN
    this.job = options.job ?? process.env.RANKLINT_AUDIT_JOB ?? 'seo:audit'
    this.artifactPath = options.artifactPath ?? 'ranklint-report.json'
    if (!this.apiUrl || !this.projectId) {
      throw new Error('GitLab storage needs CI_API_V4_URL and CI_PROJECT_ID (or explicit options)')
    }
  }

  async save(): Promise<void> {
    throw new Error('GitlabArtifactsStorage is read-only: reports are published as job artifacts by CI')
  }

  async load(ref: string): Promise<Report | null> {
    const url = `${this.apiUrl}/projects/${encodeURIComponent(this.projectId)}`
      + `/jobs/artifacts/${encodeURIComponent(ref)}/raw/${this.artifactPath}`
      + `?job=${encodeURIComponent(this.job)}`
    const headers: Record<string, string> = {}
    if (this.token) headers['JOB-TOKEN'] = this.token
    const res = await fetch(url, { headers })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`GitLab artifacts API responded ${res.status} for ref "${ref}"`)
    return await res.json() as Report
  }

  latest(): Promise<Report | null> {
    return this.load(process.env.CI_DEFAULT_BRANCH ?? 'main')
  }
}
