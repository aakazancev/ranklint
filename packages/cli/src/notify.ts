import type { DiffResult } from '@ranklint/core'
import { slackPayload, telegramText } from '@ranklint/reporters'

export interface NotifyEnv {
  slackWebhook?: string
  telegramBotToken?: string
  telegramChatId?: string
  telegramApiBase?: string
}

export function notifyEnvFromProcess(): NotifyEnv {
  return {
    slackWebhook: process.env.RANKLINT_SLACK_WEBHOOK,
    telegramBotToken: process.env.RANKLINT_TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.RANKLINT_TELEGRAM_CHAT_ID,
  }
}

export async function notify(diff: DiffResult, siteUrl: string, env: NotifyEnv): Promise<string[]> {
  const sent: string[] = []
  if (env.slackWebhook) {
    const res = await fetch(env.slackWebhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(slackPayload(diff, siteUrl)),
    })
    if (res.ok) sent.push('slack')
    else console.warn(`[ranklint] slack notification failed: ${res.status}`)
  }
  if (env.telegramBotToken && env.telegramChatId) {
    const base = env.telegramApiBase ?? 'https://api.telegram.org'
    const res = await fetch(`${base}/bot${env.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.telegramChatId, text: telegramText(diff, siteUrl) }),
    })
    if (res.ok) sent.push('telegram')
    else console.warn(`[ranklint] telegram notification failed: ${res.status}`)
  }
  return sent
}
