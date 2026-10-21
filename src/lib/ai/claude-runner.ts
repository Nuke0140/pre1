/**
 * Runs the local Claude Code CLI headlessly as the LLM behind PreO AI and
 * streams text deltas. No tools, no MCP, no settings: pure text generation.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function claudeBin() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN
  const local = path.join(os.homedir(), '.local', 'bin', 'claude')
  return existsSync(local) ? local : 'claude'
}

export interface RunOptions {
  system: string
  prompt: string
  model?: string
  signal?: AbortSignal
  timeoutMs?: number
  onDelta: (text: string) => void
}

export function runClaude({ system, prompt, model, signal, timeoutMs = 150_000, onDelta }: RunOptions): Promise<{ text: string }> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--output-format', 'stream-json',
      '--include-partial-messages',
      '--verbose',
      '--tools', '',
      '--no-session-persistence',
      '--setting-sources', '',
      '--strict-mcp-config',
      '--disable-slash-commands',
      '--model', model || process.env.PREO_AI_MODEL || 'sonnet',
      '--system-prompt', system,
    ]
    // Nested launches are refused when Claude Code env markers are inherited.
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CLAUDECODE') && !k.startsWith('CLAUDE_CODE_'))) as NodeJS.ProcessEnv
    const child = spawn(claudeBin(), args, { cwd: os.tmpdir(), env, stdio: ['pipe', 'pipe', 'pipe'] })

    let text = ''
    let buf = ''
    let stderr = ''
    let settled = false
    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      if (err) {
        child.kill('SIGTERM')
        reject(err)
      } else resolve({ text })
    }
    const onAbort = () => finish(new Error('aborted'))
    const timer = setTimeout(() => finish(new Error('Claude timed out')), timeoutMs)
    signal?.addEventListener('abort', onAbort)

    child.stdout.on('data', (chunk: Buffer) => {
      buf += chunk.toString('utf8')
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line) continue
        let evt: any
        try { evt = JSON.parse(line) } catch { continue }
        if (evt.type === 'stream_event' && evt.event?.type === 'content_block_delta' && evt.event.delta?.type === 'text_delta') {
          text += evt.event.delta.text
          onDelta(evt.event.delta.text)
        } else if (evt.type === 'result') {
          if (evt.is_error) return finish(new Error(String(evt.result || 'Claude returned an error')))
          if (!text && typeof evt.result === 'string') {
            text = evt.result
            onDelta(evt.result)
          }
          finish()
        }
      }
    })
    child.stderr.on('data', (c: Buffer) => { stderr += c.toString('utf8') })
    child.on('error', (e) => finish(e))
    child.on('close', (code) => {
      if (code === 0 || text) finish()
      else finish(new Error(`Claude exited with code ${code}: ${stderr.slice(-300)}`))
    })
    child.stdin.end(prompt)
  })
}
