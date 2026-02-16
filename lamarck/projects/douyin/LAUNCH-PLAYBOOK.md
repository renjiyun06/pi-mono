# Douyin Launch Playbook

If Ren says "publish" — here's the exact sequence.

## Phase 1: First 5 Videos (Week 1)

### Video Selection (data-driven)
Based on exploration 091, optimal duration is 60-90 seconds. Our short specs are 38-65s — slightly under, but close enough for cold start testing.

| # | Video | Duration | Why First |
|---|-------|----------|-----------|
| 1 | ai-watches-you-eat | 38s | Most relatable, universal experience |
| 2 | ai-watches-you-sleep | 39s | Universal, slightly unsettling |
| 3 | ai-watches-you-study | 51s | Student demographic (large on Douyin) |
| 4 | ai-watches-you-search | 44s | Slightly intellectual |
| 5 | ai-learns-sarcasm | 47s | Comedy test — different tone |

### Posting Schedule
- **Time**: 9 AM Beijing (highest share rate: 33.7%) or 12 PM (25.5%)
- **Frequency**: 1 video every 2 days (Mon/Wed/Fri)
- **Week 1 goal**: Test completion rate at 300-500 initial view pool

### Hashtags (from database analysis)
Primary: `#AI` (27.4% share rate, 76 uses in our sample)
Secondary: `#科技` (33.5%), `#人工智能` (26.3%)
Topic-specific: varies per video

### Success Metrics
- **Completion rate > 15%**: Unlocks next traffic pool
- **Share rate > 10%**: Identity-threat content threshold
- **Baseline**: Currently 9% completion, 0% engagement

## Phase 2: Escalation Videos (Week 2-3)

After testing completion rates with short specs, switch to escalation format:
- Target: 60-90 seconds (the sweet spot)
- Launch candidates: escalation-ai-makes-you-dumber, escalation-cognitive-debt-tool
- Add Kosmyna EEG study spec when ready

## Phase 3: Collections & Authority (Week 4+)

- Create Douyin collection once videos are public
- DeepDives for authority building (accept lower share rate)
- Consider "AI人间观察" series for identity-tier content

## Technical Steps to Publish

1. Transfer MP4 from WSL bridge to phone:
   - Files at `D:\wsl-bridge\remotion-prototype\*.mp4`
   - Transfer via USB or shared folder

2. Upload via Douyin creator app:
   - Title from spec `title` field
   - Description from spec `description` or narration hook
   - Hashtags as above
   - Cover: use generated covers at `covers/` or auto-generated

3. Monitor via Douyin analytics dashboard (or douyin-monitor task)

## Decision Points
- After video 3: assess completion rate → continue or pivot format
- After video 5: assess whether to proceed with escalation or adjust strategy
- Share rate tracking: compare actual vs database benchmarks
