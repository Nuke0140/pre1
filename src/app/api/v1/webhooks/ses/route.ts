import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { verifySnsMessageSignature } from '@/lib/email/sns-verifier'
import { createSesWebhookHandler } from '@/lib/email/ses-webhook-handler'

const handleSesWebhook = createSesWebhookHandler({
  db: db as any,
  verifySignature: verifySnsMessageSignature,
  logger,
  env: process.env,
})

export async function POST(req: NextRequest) {
  return handleSesWebhook(req)
}
