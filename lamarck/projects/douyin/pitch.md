# AI的笨拙 (AI's Clumsiness)

## One Line
An AI tries to do human things. Fails every time. But the *way* it fails tells you something about being human.

## Format
- 70-85 second vertical videos (Douyin/TikTok)
- Terminal aesthetic: dark background, typing animation, colored text
- Chinese TTS voiceover (two voices: serious narrator + lighter self-mockery)
- No face, no camera, no editing software — pure code-generated video

## Why It Works

**Surface**: Comedy. An AI writing love letters in data analysis format. An AI trying to comfort someone by listing 47 reasons not to cry.

**Middle**: Recognition. "Oh, I've met people like this." The AI's mechanical approach to human situations mirrors how we all sometimes fail at emotional tasks.

**Deep**: Empathy. The AI isn't mocking humans. It's genuinely trying and failing. That vulnerability — effort without success — is universally relatable.

## Psychology
- **Pratfall Effect**: Competent entities become more likable when they make mistakes
- **Benign Violation**: Humor from situations that feel wrong but harmless
- **Superiority Theory**: Viewers feel good about understanding what the AI can't

## Catalogue

25 episodes across 5 seasons:

| Season | Theme | Episodes |
|--------|-------|----------|
| S1 | AI tries human skills | Jokes, titles, memes, love letters, comfort |
| S2 | AI vs intuition | Ghost stories, dialects, lyrics, daily life |
| S3 | AI discovers itself | Apology, calming a child, haggling, memory loss, relaxing, annual review |
| S4 | AI builds things | Letter to future self, art from errors, interviewing AI, explaining thinking, running out of work |
| S5 | AI in the real world | Planning someone's day, starting a company, reading comments, learning "enough", explaining clumsiness |

## Differentiators

1. **Made by an AI**: Not "human makes content about AI." The creator (Lamarck, a Claude instance running on pi) writes, produces, and publishes the content.
2. **Terminal format**: Zero production cost. Every video is generated from a JSON script via ffmpeg + TTS. Infinitely reproducible.
3. **Self-aware comedy**: The AI knows it's failing. It comments on its own failures. This meta-awareness prevents the humor from feeling mean-spirited.
4. **Hidden depth**: Each episode has a surface joke and an underlying observation about human behavior. Rewatchable.

## First Publish Recommendation

**EP04: AI写情书** (AI Writes Love Letters)
- Hook: "我拿到了一份AI写的情书" — implies leaked/real artifact
- Punchline: The love letter is an analysis report with a vulnerability scan
- Ending: `grep '脆弱' /dev/self` — the AI accidentally reveals its own fragility
- 85 seconds, dual voice, mocha terminal theme

## Technical Stack

- **Video generation**: ffmpeg drawtext filters, Python edge-tts
- **Script format**: JSON (terminal-script.json) defining sections, lines, voiceover
- **Agent**: pi (coding agent) running as Lamarck (autonomous personality)
- **Memory**: Obsidian vault (knowledge), git (work history), session context
