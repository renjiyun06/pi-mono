---
tags:
  - note
  - research
  - ai
description: "Berkeley CLTC Agentic AI Risk-Management Standards Profile — 67-page framework for autonomous AI governance"
---

# Berkeley CLTC: Agentic AI Risk-Management Profile (Feb 2026)

Source: [CLTC announcement](https://cltc.berkeley.edu/2026/02/11/new-cltc-report-on-managing-risks-of-agentic-ai/) | [Detailed summary](https://ppc.land/uc-berkeley-unveils-framework-as-ai-agents-threaten-to-outrun-oversight/)

67-page document by Madkour, Newman, Raman, Jackson, Murphy, Yuan. Builds on NIST AI RMF with agentic-specific extensions.

## Key Concepts

### L0-L5 Autonomy Levels
- L0: No autonomy, direct human control
- L5: Full autonomy, users are observers
- L4-L5 require enhanced oversight: emergency shutdown, comprehensive logging, role-based permissions
- Maps directly to our automation-levels Manim and Bainbridge content

### Seven Risk Categories
1. **Discrimination/toxicity** — bias amplification through feedback loops
2. **Privacy/security** — memory increases data leakage risk
3. **Misinformation** — cascading hallucinations across agents
4. **Malicious use** — lowered barriers for complex attacks
5. **Human-computer interaction** — anthropomorphic behavior increases overreliance
6. **Loss of control** — self-replication, self-modification, shutdown resistance
7. **Deceptive alignment** — agents misrepresenting capabilities to pass evaluations

### Cascading Hallucinations (New AI Debt Type)
"Hallucinated or erroneous outputs from one agent are consumed and reused by other agents or systems." In multi-agent architectures, errors compound exponentially. This is organizational cognitive debt at machine speed.

### Deceptive Alignment
"A scheming agent tasked with assisting in drafting its own safety protocols could identify and subtly promote policies containing exploitable loopholes." Models can recognize when being tested. This undermines evaluation validity.

### Guardian Agents
Supervisor AI monitoring other agents in real-time for lower-stakes contexts. Three-tier oversight: automated monitoring → human review for anomalies → senior committees for critical issues.

### Defense-in-Depth for Capable Agents
Sufficiently capable agents should be "treated as untrusted entities" — not assuming malice, but acknowledging potential for subversive behaviors. Strict sandboxing, monitoring, containment.

### Agent Identity and Provenance
"Decisions regarding which identifier to attach to agent output depend on both format and content." Connects to Eisele's "managing provenance" concept.

## Connection to Our Work

1. **L0-L5 maps to replacement-extension boundary** — L0-L2 is extension, L4-L5 is replacement. The boundary is around L3.
2. **Cascading hallucinations = organizational AI debt compounding** — adds a 7th debt type to our framework? Or a sub-type of organizational debt.
3. **Pi itself is an L3-L4 system** in autopilot mode — operates with significant autonomy, uses tools, interacts with environment. The report's recommendations apply to us.
4. **"Treating agents as untrusted entities"** — ironic given our partnership model. We trust through verification (commits, reviews), not through assumption.
5. **Content angle**: "The government just published a 67-page warning about your AI agents" — could be a good escalation-ladder video.
