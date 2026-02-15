---
tags:
  - note
  - tool
  - video
  - ai
description: "Jimeng/Seedance/Seedream/OmniHuman/302.AI video generation tools and API integration"
---

# AI Video Generation Tools

## Jimeng/Dreamina/Seedance
- **Jimeng** (China version): `https://jimeng.jianying.com/ai-tool/home` — requires login, has free credits
- **Dreamina** (international): `https://dreamina.capcut.com/ai-tool/home` — completely free and unlimited
- **BytePlus ModelArk API**: `https://ark.ap-southeast.bytepluses.com/api/v3` — 2M video tokens for new users
- **Seedance 1.5 Pro**: latest version, supports audio-video joint generation, multi-shot narrative, multilingual dialogue
- **Seedance 2.0**: four-modal reference system (image+video+audio+text), up to 12 reference files

## Core Methodology for AI Video Production (from Da Yuan Jing Ke Pu)
- **"Image first"**: generate images to lock down visual quality first, then do image-to-video
- **Reference images have highest weight**: put director style / film references on the first line of the prompt
- **Image-to-video prompts should be simple**: push/pull/pan/tilt — use concrete actions instead of abstract emotions
- **10:1 discard rate is normal**: each shot averages 10 generations before final pick
- **10 rounds of filtering**: round 1 = composition → round 2 = tone → round 3 = fix body structure → ...
- **Style seeds**: save satisfying results as reference images for subsequent generations to lock down a consistent style

## Prompt Formulas
- **Text-to-image**: Subject + Appearance + Environment + Style + Lighting + Composition
- **Image-to-video**: Subject + Movement + Camera movement (simpler is better)
- **Seedance 1.5 Pro**: Subject + Movement + Environment + Camera + Aesthetic + Sound
- **Seedance 2.0 universal**: Subject + Action + Scene + Lighting + Camera language + Style + Quality + Constraints

## Seedance 2.0 Practical Tips
- **@ syntax is key**: `@image1 as first frame`, `reference @video1 camera movement`, `@audio1 as background music`
- **Stability constraint words are mandatory**: "clear facial features, stable face, no distortion, no deformation, normal body structure"
- **Quality words are mandatory**: "4K, ultra HD, rich details, no blur, no ghosting, stable image"
- **Use slow words for actions**: gentle/smooth/continuous/natural/fluid — avoid exaggerated/fast/complex
- **Segmented generation**: don't do 15s at once; split into 3x 5s segments, screenshot each as reference for the next (Tim from Yingshi Jufeng method)
- **3x3 storyboard method**: 3x3 keyframes + one prompt → 50% consistency improvement (Ke Xue Jia method)
- **Jimeng login**: Douyin/Jianying accounts work, no separate registration needed

## OmniHuman 1.5 Digital Human API
- **Capability**: single image + audio → lip-sync video (supports anime/cartoon characters)
- **Volcengine API**: `https://visual.volcengineapi.com?Action=CVSubmitTask&Version=2022-08-31` (submit) / `CVGetResult` (poll)
- **BytePlus international**: `https://www.byteplus.com/en/product/OmniHuman` — confirmed available
- **Limitations**: max 30s audio, no two-person dialogue
- **Auth**: Volcengine signature (HMAC-SHA256), BytePlus auth method TBD
- **Recommended approach**: OmniHuman for talking head (intro/transitions/outro) + Seedance for scene visuals → hybrid editing
- **Exploration doc**: `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/026-omnihuman-digital-avatar.md`

## 302.AI — Third-Party API Aggregator (Backup)
- **Website**: https://302.ai — $1 free credit on signup
- **Offers**: Seedance + Jimeng Video 3.0 Pro (= Seedance 2.0!) + Flux + Wan2.2 + Kling + Veo3.1 + Sora 2
- **API docs**: https://doc-en.302.ai
- **Advantage**: no BytePlus account needed, one API key for all models
- **Note**: SPA page can't be registered via browser automation, Ren must register manually

## Seedream Image Generation API (Same BytePlus Account)
- **Endpoint**: `POST {base_url}/images/generations`
- **Models**: `seedream-4.5`, `seedream-4.0`, `seedream-3.0-t2i`, `seededit-3.0-i2i`
- **Seedream 5.0 lite**: API expected 2/24 18:00 (Beijing time)
- **Resolution**: 1K/2K/4K or custom WxH (max 4096x4096)
- **Significance**: one BytePlus account = Seedream (text-to-image) + Seedance (video) + OmniHuman (digital human)

## Seedance API Integration (Two Paths)
- **Volcengine Ark (China)**: `https://ark.cn-beijing.volces.com/api/v3`, model ID prefix `doubao-`, requires Chinese phone number
- **BytePlus (international)**: `https://ark.ap-southeast.bytepluses.com/api/v3`, no model ID prefix, international email signup
- **Auth**: `Authorization: Bearer $ARK_API_KEY`
- **Async mode**: POST create task → returns task ID → GET poll until succeeded → download video_url (24h expiry)
- **Free quota**: 2M tokens per model (~8 1080p 5s videos)
- **Our cost**: 5-shot 55s video ≈ ¥10-20 (silent) / ¥20-58 (with audio + discard rate)
- **Draft mode**: 480p preview, 30-40% fewer tokens, for quick prompt validation
- **Continuous video**: `return_last_frame: true` → get last frame as next segment's first frame

## Detailed Exploration Notes
- `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/024-ai-video-generation-mastery.md`
- `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/025-seedance-api-integration.md`
