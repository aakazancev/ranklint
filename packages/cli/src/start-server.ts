import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, () => {
      const address = server.address()
      if (typeof address === 'object' && address) {
        const port = address.port
        server.close(() => resolve(port))
      } else {
        server.close(() => reject(new Error('Could not allocate a port')))
      }
    })
  })
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export interface RunningServer {
  url: string
  stop: () => Promise<void>
}

export async function startServer(entry: string, timeoutMs = 30_000): Promise<RunningServer> {
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const child = spawn('node', [entry], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NITRO_PORT: String(port) },
    stdio: 'ignore',
  })
  const exited = new Promise<void>((resolve) => {
    child.once('exit', () => resolve())
  })

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Server process exited with code ${child.exitCode} before becoming ready`)
    }
    try {
      await fetch(url, { method: 'HEAD' })
      return {
        url,
        stop: async () => {
          child.kill('SIGTERM')
          await Promise.race([exited, sleep(5000)])
          if (child.exitCode === null) child.kill('SIGKILL')
        },
      }
    } catch {
      await sleep(300)
    }
  }
  child.kill('SIGKILL')
  throw new Error(`Server at ${entry} did not become ready within ${timeoutMs}ms`)
}
