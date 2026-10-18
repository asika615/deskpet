# Coopanion 当前工程

- 工作目录：`coopanion-workspace/`（所有路径均以此目录为基准）。
- 当前性能对照：`versions/v0.3.15/reference-companion/`；更早版本作为历史保留。
- 当前版本：`versions/v0.3.18/reference-companion/`，已装入本机 Coopanion 测试。
- 唯一美术基准：`references/original.png`；工程内 original.png 保留运行依赖。
- 最近更新：在 v0.3.16 轻量渲染基础上为双臂加入原生肩肘腕驱动、平滑动作切换和 greet→wave 映射；保留原始素材和既有面部管线。
- 保留项：Head 整体位置、比例、当前头壳轮廓；表情、发型设计；双臂 wave/跳跃/拖拽等动作；白色板甲、外套结构。
- 仓库保留 v0.3.11 至 v0.3.18 的版本历史；不要无请求删除旧版或 references。
- 对照图必须直接渲染本工程组件，不得重绘替代。
- 临时运行环境无法由工程锁定；历史交接文件中的 scratch 路径和保存回执不是当前仓库状态的证明。

## 恢复方式

克隆仓库后先阅读本文件、`README.md`、`handoff/STATUS.md` 与 `handoff/checksums.json`。运行 `python tools/check-workspace.py` 检查文件，再通过 `python start-preview.py` 预览当前版本。`REPORT.md` 记录的是 v0.3.12；当前变更及限制见 v0.3.18 目录内的 CHANGELOG、README 和验证报告。
