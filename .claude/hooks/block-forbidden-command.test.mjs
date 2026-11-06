import { describe, expect, it } from 'vitest'
import { check } from './block-forbidden-command.mjs'

const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } })

describe('block-forbidden-command', () => {
  it('blocks git push to main', () => {
    expect(check(bash('git push origin main')).blocked).toBe(true)
    expect(check(bash('git push -u origin main')).blocked).toBe(true)
  })

  it('gives a reason when blocked', () => {
    expect(check(bash('git push origin main')).reason).toMatch(/main/)
  })

  it('allows pushing a feature branch', () => {
    expect(check(bash('git push origin feat/x')).blocked).toBe(false)
  })

  it('allows other git commands', () => {
    expect(check(bash('git commit -m "x"')).blocked).toBe(false)
    expect(check(bash('git checkout main')).blocked).toBe(false)
  })

  it('ignores non-Bash tools and malformed input', () => {
    expect(check({ tool_name: 'Read', tool_input: { file_path: 'main' } }).blocked).toBe(false)
    expect(check(undefined).blocked).toBe(false)
    expect(check({ tool_name: 'Bash' }).blocked).toBe(false)
  })
})
