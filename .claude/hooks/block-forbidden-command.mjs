#!/usr/bin/env node
// PreToolUse hook: blocks `git push` to main. Exit 2 + stderr makes Claude Code refuse the call.
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const PUSH_TO_MAIN = /\bgit\s+push\b.*\bmain\b/

export const check = (input) =>
  input?.tool_name === 'Bash' && PUSH_TO_MAIN.test(input.tool_input?.command ?? '')
    ? { blocked: true, reason: 'Never push to main. Push a feature branch and open a PR.' }
    : { blocked: false }

const main = () => {
  let input
  try {
    input = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return // malformed hook input: fail open
  }
  const { blocked, reason } = check(input)
  if (blocked) {
    process.stderr.write(`Blocked by block-forbidden-command hook: ${reason}\n`)
    process.exit(2)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
