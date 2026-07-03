import type { Report, ReportStorage } from '@ranklint/core'

export interface S3Client {
  putObject(key: string, body: string): Promise<void>
  getObject(key: string): Promise<string | null>
  listKeys(prefix: string): Promise<{ key: string, lastModified: number }[]>
}

export interface S3StorageOptions {
  bucket: string
  prefix?: string
  endpoint?: string
  region?: string
  client?: S3Client
}

async function awsClient(opts: S3StorageOptions): Promise<S3Client> {
  let sdk: typeof import('@aws-sdk/client-s3')
  try {
    sdk = await import('@aws-sdk/client-s3')
  } catch {
    throw new Error('S3 storage requires "@aws-sdk/client-s3" — install it: pnpm add @aws-sdk/client-s3')
  }
  const s3 = new sdk.S3Client({
    ...(opts.endpoint ? { endpoint: opts.endpoint, forcePathStyle: true } : {}),
    ...(opts.region ? { region: opts.region } : {}),
  })
  return {
    async putObject(key, body) {
      await s3.send(new sdk.PutObjectCommand({ Bucket: opts.bucket, Key: key, Body: body }))
    },
    async getObject(key) {
      try {
        const res = await s3.send(new sdk.GetObjectCommand({ Bucket: opts.bucket, Key: key }))
        return await res.Body?.transformToString() ?? null
      } catch {
        return null
      }
    },
    async listKeys(prefix) {
      const res = await s3.send(new sdk.ListObjectsV2Command({ Bucket: opts.bucket, Prefix: prefix }))
      return (res.Contents ?? []).map(obj => ({
        key: obj.Key ?? '',
        lastModified: obj.LastModified?.getTime() ?? 0,
      }))
    },
  }
}

export class S3ReportStorage implements ReportStorage {
  private clientPromise?: Promise<S3Client>

  constructor(private options: S3StorageOptions) {}

  private client(): Promise<S3Client> {
    this.clientPromise ??= this.options.client
      ? Promise.resolve(this.options.client)
      : awsClient(this.options)
    return this.clientPromise
  }

  private key(name: string): string {
    const prefix = this.options.prefix ?? 'ranklint'
    return `${prefix}/${name.replace(/[^a-z0-9_.-]/gi, '_')}.json`
  }

  async save(report: Report, key: string): Promise<void> {
    await (await this.client()).putObject(this.key(key), JSON.stringify(report))
  }

  async load(key: string): Promise<Report | null> {
    const body = await (await this.client()).getObject(this.key(key))
    return body ? JSON.parse(body) as Report : null
  }

  async latest(): Promise<Report | null> {
    const client = await this.client()
    const keys = await client.listKeys(this.options.prefix ?? 'ranklint')
    const newest = keys.sort((a, b) => b.lastModified - a.lastModified)[0]
    if (!newest) return null
    const body = await client.getObject(newest.key)
    return body ? JSON.parse(body) as Report : null
  }
}
