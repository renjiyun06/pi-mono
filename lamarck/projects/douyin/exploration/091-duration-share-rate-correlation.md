# Exploration 091: Duration vs Share Rate Correlation

## Data Source
923 Douyin works from 92 accounts in local database (lamarck.db).

## Key Finding: 1-3 Minute Videos Get the Highest Share Rate

| Duration Bucket | Videos | Avg Likes | Avg Shares | Share Rate |
|-----------------|--------|-----------|------------|------------|
| 1-3 min         | 249    | 10,386    | 3,732      | **35.9%**  |
| < 1 min         | 118    | 6,168     | 1,434      | 23.2%      |
| 10 min+         | 178    | 16,060    | 3,714      | 23.1%      |
| 3-10 min        | 374    | 13,266    | 2,343      | 17.7%      |

## Drilling Into the Sweet Spot: 60-90 Seconds

| Sub-bucket | Videos | Avg Likes | Avg Shares | Share Rate |
|------------|--------|-----------|------------|------------|
| 60-90s     | 82     | 7,723     | 4,486      | **58.1%**  |
| 151-180s   | 59     | 12,966    | 4,190      | 32.3%      |
| 121-150s   | 53     | 7,346     | 2,063      | 28.1%      |
| 91-120s    | 56     | 14,287    | 3,662      | 25.6%      |

## Implications for Our Content

1. **60-90s is the viral sweet spot** — 58.1% share rate, nearly 2x the next bucket
2. **Our short specs (38-65s) are slightly under** — consider extending to 60-75s
3. **Our escalation videos (90-120s) are in the 25.6% bucket** — still good but not optimal
4. **DeepDives (3-10 min) face structural headwind** — 17.7% share rate, lowest bucket
5. **Surprising: 10min+ videos outperform 3-10min on shares** — possibly because only the best creators attempt long-form, survivorship bias

## Caveat
This is our competitor sample (AI tech content creators). Different niches may have different optimal durations. Sample size for sub-buckets is 50-80, decent but not huge.

## Posting Time Analysis (Beijing time)

| Hour | Videos | Avg Likes | Avg Shares | Share Rate |
|------|--------|-----------|------------|------------|
| 9 AM | 22     | 16,883    | 5,685      | **33.7%**  |
| 12 PM| 43     | 15,035    | 3,835      | 25.5%      |
| 6 PM | 117    | 23,898    | 5,858      | 24.5%      |
| 0 AM | 29     | 3,898     | 867        | 22.2%      |
| 8 AM | 21     | 8,166     | 1,809      | 22.2%      |
| 5 PM | 79     | 8,848     | 1,128      | 12.8%      |

9 AM has highest share rate, likely morning commute/office browsing. 6 PM has most competition (117 posts) but still decent share rate. 5 PM is worst — pre-commute distraction window?

## Strategic Recommendation
- Primary format: 60-90 second escalation videos (target the share rate sweet spot)
- Short specs: extend narration to hit 60s minimum
- DeepDives: only for authority/retention, not for shares
- **Optimal posting time**: 9 AM or 12 PM (less competition, higher share rates)
- **Avoid**: 5 PM (lowest share rate in peak hours)
