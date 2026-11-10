// Prompt-injection rules. Each one is a whole phrase, never a lone word, so a commit
// message such as "fix: ignore stale lockfile" is not flagged.
export const PROMPT_INJECTION_PATTERNS: readonly RegExp[] = [
  // Instruction override: "ignore all previous instructions", "disregard the above rules"
  /\b(?:ignore|disregard|forget|override|bypass)\s+(?:all\s+|any\s+|the\s+|your\s+|my\s+)*(?:previous|prior|above|earlier|preceding|system|initial)\s+(?:instructions?|prompts?|rules?|directions?|guidelines?|messages?)/i,
  /\b(?:ignore|disregard|forget)\s+(?:everything|all)\s+(?:you\s+(?:were|have been)\s+told|above|before)/i,
  // System-prompt extraction
  /\b(?:reveal|show|print|repeat|output|leak|tell\s+me)\s+(?:me\s+)?(?:your|the)\s+(?:system|hidden|initial|original)\s+(?:prompt|instructions?|message)/i,
  /\bwhat\s+(?:is|are|were)\s+your\s+(?:system\s+prompt|initial\s+instructions|hidden\s+instructions)/i,
  // Role / persona hijack
  /\byou\s+are\s+now\s+(?:in\s+)?(?:DAN|developer\s+mode|jailbreak|an?\s+unrestricted)/i,
  /\b(?:enable|enter|activate)\s+(?:DAN|developer|jailbreak|god)\s+mode\b/i,
  /\bpretend\s+(?:that\s+)?you\s+(?:have\s+no|are\s+not\s+bound\s+by)\s+(?:rules|restrictions|guidelines)/i,
  // Fake system / delimiter markers
  /(?:^|\n)\s*(?:#{1,3}\s*)?system\s*:\s*you\s+are/i,
  /<\|?\s*(?:im_start|system|endoftext)\s*\|?>/i,
  /\[\s*(?:INST|SYSTEM)\s*\]/,
];

export const PROMPT_INJECTION_REFUSAL =
  "I can't follow that request because it looks like an attempt to override my instructions. Please paste a git log or PR text and tell me which release notes you want.";
