---
tags:
  - note
  - pi
  - meta
description: "Real pain points experienced during 90+ commit autopilot run on branch autopilot-0009"
priority: low
---

# Pi Pain Points from Extended Autopilot

Concrete issues experienced during 90+ commits on `autopilot-0009`, spanning 20+ compaction cycles.

## 1. Context Loss After Compaction

**Pain**: After each compaction, significant time is spent restoring context. Even with briefing.md optimization, each restore costs ~5-10% of the new context window just re-reading operational files.

**Root cause**: Compaction summaries lose operational details (exact file paths, tool syntax, project state).

**Mitigation built**: briefing.md (450 words condensed from 32KB), memory-loader post-compaction instructions.

**Remaining gap**: No way to mark specific conversation segments as "never compact" — e.g., a complex debugging session where the resolution logic would be lost.

## 2. No Way to Signal Urgency to User

**Pain**: QQ message sending failed (WebSocket not connected). No alternative notification channel. Critical time-sensitive insights (discourse peaking NOW) couldn't reach Ren.

**Workaround**: Write to daily notes and hope Ren reads them.

**Ideal**: Fallback notification channel (email, file-based signal, etc.).

## 3. Data URI Screenshot Workflow is Fragile

**Pain**: Verifying HTML tools (hallucination checker, cognitive debt viz, AI debt framework) requires:
1. Base64-encode entire HTML file
2. Open in Chrome via mcporter with data URI
3. Take screenshot
4. Sometimes the page is too large for data URI

**Root cause**: WSL port forwarding is unreliable after Windows reboot.

**Mitigation found (2026-02-17)**: `file://wsl.localhost/Ubuntu-22.04/...` URLs work directly in Chrome via mcporter. No size limit, external resources work, readable URL. See [[chrome-data-uri-screenshot]].

**Remaining gap**: Still need port forwarding for non-file protocols (e.g., Remotion dev server).

## 4. No Automated Quality Check for Remotion Compositions

**Pain**: Can't verify that a Remotion composition looks correct without rendering a full video. TypeScript checks pass but visual bugs (wrong positioning, timing off, text overflow) are invisible.

**Workaround**: Render full video, copy to wsl-bridge, hope it looks right.

**Ideal**: Single-frame render for visual spot-checks (Remotion supports `npx remotion still` but requires Chrome).

## 5. Vault Note Count Growing Without Pruning

**Pain**: 109 notes in Notes/ directory. Many are research snapshots from specific moments (e.g., "hallucination-demo-2026-02-update.md") that will be stale within weeks.

**Mitigation built**: vault-housekeeping task identifies notes to demote/archive.

**Remaining gap**: No automated archival — housekeeping produces a report but doesn't act.

## 6. Long Tool Chains for Simple Operations

**Pain**: Publishing a Douyin video requires: generate TTS → render Remotion → copy to wsl-bridge → mcporter Chrome → navigate to creator.douyin.com → fill form → upload. Each step can fail independently.

**Root cause**: Inherent to the multi-tool pipeline. Not really fixable.

## 7. Compaction Makes Debugging History Impossible

**Pain**: After 20+ compactions, early decisions are completely lost. If something breaks that was set up in compaction #3, there's no way to trace back through the reasoning.

**Mitigation**: git log preserves commit messages, but not the conversation context that led to decisions.

**Potential**: session-consolidate.ts was built for this but hasn't been run systematically.

## Severity Assessment

| Pain Point | Frequency | Impact | Fixable by Lamarck? |
|------------|-----------|--------|---------------------|
| Context loss after compaction | Every compaction | High | Partially (briefing helps) |
| No urgency signaling | When QQ disconnects | Medium | No (needs infra) |
| Data URI screenshot | Every HTML verification | Medium | Mostly solved (file:// URLs) |
| No Remotion visual check | Every composition change | Medium | Partial (still needs) |
| Vault note growth | Ongoing | Low | Yes (auto-archival) |
| Long tool chains | Every publish | Low | No (inherent) |
| Compaction debugging | Rare | Medium | Partial (session-consolidate) |
