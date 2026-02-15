---
tags:
  - issue
  - pi
status: resolved
priority: low
description: "glm-4.7 model ID conflict between opencode and zai providers"
---

# Duplicate Model ID: glm-4.7 (opencode vs zai)

**Discovered**: 2026-02-14

**Problem**: `models.generated.ts` has both `opencode` and `zai` providers offering `glm-4.7`, resulting in two `"glm-4.7"` keys in the same `MODELS` object. JavaScript objects silently let the latter overwrite the former, so opencode's glm-4.7 is silently dropped.

**Impact**:
- OpenCode's glm-4.7 cannot be selected via `/model`
- Selecting glm-4.7 always routes to zai provider

**Root cause**: `generate-models.ts` doesn't handle cross-provider model ID conflicts

**Resolution**: Model IDs are already namespaced per provider in the generated file (e.g., "zai.glm-4.7" under zai provider, "zai-glm-4.7" under cerebras). The MODELS structure uses `MODELS[provider][modelId]`, so cross-provider same-ID models are stored separately. No actual conflict exists in current codebase. Resolved 2026-02-15.
