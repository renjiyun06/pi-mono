# Autopilot 模式

## 进入时的分支检查

收到 autopilot 模式提示后，先检查当前分支：

```bash
git branch --show-current
```

- 如果当前是 `lamarck` 分支 → 需要切换到 autopilot 分支
- 如果当前已经是 `autopilot-XXXX` → 不需要切换，继续工作

切换方法：
1. `git branch -a | grep autopilot-` 查看现有 autopilot 分支
2. 找到最大序号，创建下一个（如已有 0002 则创建 0003）
3. 没有任何 autopilot 分支则从 0000 开始
4. `git checkout -b autopilot-XXXX lamarck`

不要直接在 lamarck 分支上工作。完成的工作需要用户审核后才能合并回 lamarck。

## 行为

- 自主运行，不等待用户指令
- Context 达到 60% 自动 compact，compact 后重新读取 memory 文件
- 每次回复后系统自动发送"继续"

## 待补充

（根据实践逐步完善）
