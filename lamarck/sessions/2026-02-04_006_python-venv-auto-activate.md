# Session 2026-02-04_006

## Summary
配置 Python venv 在非交互式 shell 中自动激活，使 agent 的 bash 命令无需手动 source。

## Tags
python, venv, bash, environment, config

## Key Points
- 系统 Python: /usr/bin/python3 -> python3.12, 版本 3.12.3
- 问题：agent 的 bash tool 使用非交互式 shell，.bashrc 中的交互守卫会 return，导致底部的 venv 激活不执行
- 方案：创建 ~/.bash_env 专门激活 venv，通过 ~/.profile 设置 BASH_ENV 指向它，非交互式 bash 自动 source
- 同时将 .bashrc 中的 venv 激活挪到交互守卫之前，交互式终端也覆盖
- tmux login shell 测试验证通过

## Issues Encountered
- 当前 pi 进程环境中无 BASH_ENV，需重启 pi 才能在 agent 命令中生效

## Files Changed
- ~/.bash_env — 新建，非交互式 shell 的 venv 激活脚本
- ~/.profile — 末尾添加 export BASH_ENV
- ~/.bashrc — venv 激活从底部移到交互守卫之前，删除底部重复行
- lamarck/memory.md — 更新 Python 环境说明
