#!/usr/bin/env node
// PreToolUse hook: runs lint and build across the workspace via turbo before the `commit` skill. Exit 2 + stderr blocks the skill.
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const STEPS = ['lint', 'build']
const TAIL_LINES = 40

export const isCommitSkill = (input) =>
  input?.tool_name === 'Skill' && input.tool_input?.skill === 'commit'

const tail = (text) => text.trim().split('\n').slice(-TAIL_LINES).join('\n')

const runStep = (step, cwd) => {
  const { status, stdout, stderr } = spawnSync('pnpm', ['turbo', 'run', step], { cwd, encoding: 'utf8' })
  return { ok: status === 0, output: tail(`${stdout ?? ''}\n${stderr ?? ''}`) }
}

const main = () => {
  let input
  try {
    input = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return // malformed hook input: fail open
  }
  if (!isCommitSkill(input)) return

  const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()
  for (const step of STEPS) {
    const { ok, output } = runStep(step, root)
    if (!ok) {
      process.stderr.write(
        `Blocked by verify-before-commit hook: \`pnpm turbo run ${step}\` failed. Fix it, then run /commit again.\n${output}\n`,
      )
      process.exit(2)
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
