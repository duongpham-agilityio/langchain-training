import { describe, expect, it } from 'vitest'
import { isAutoFix } from './detect-auto-fix.mjs'

describe('detect-auto-fix', () => {
  it('detects the auto-fix marker in the prompt', () => {
    expect(isAutoFix({ prompt: '"Auto-fix pull requests" was just enabled' })).toBe(true)
  })

  it('ignores prompts without the marker', () => {
    expect(isAutoFix({ prompt: 'fix the login bug' })).toBe(false)
  })

  it('ignores missing prompt and malformed input', () => {
    expect(isAutoFix({})).toBe(false)
    expect(isAutoFix(undefined)).toBe(false)
  })
})
