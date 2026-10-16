# Coopanion 当前工程

- 工作目录：`coopanion-workspace/`（所有路径均以此目录为基准）。
- 当前对照基线：`versions/v0.3.13/reference-companion/`；更早版本作为历史保留。
- 当前版本：`versions/v0.3.14/reference-companion/`，附带软件验证报告；尚未进行 Electron 实机验收。
- 唯一美术基准：`references/original.png`；工程内 original.png 保留运行依赖。
- 最近更新：从原图恢复胸口局部面料、修正已有肩根的躯干遮挡，并提取原图尾巴纹理；保留已修好的头颈连接和动作系统。
- 保留项：Head 整体位置、比例、当前头壳轮廓；表情、发型设计；wave 肩肘腕运动、白色板甲、外套结构。
- 仓库保留 v0.3.11 至 v0.3.14 的版本历史；不要无请求删除旧版或 references。
- 对照图必须直接渲染本工程组件，不得重绘替代。
- 临时运行环境无法由工程锁定；历史交接文件中的 scratch 路径和保存回执不是当前仓库状态的证明。

## 恢复方式

克隆仓库后先阅读本文件、`README.md`、`handoff/STATUS.md` 与 `handoff/checksums.json`。运行 `python tools/check-workspace.py` 检查文件，再通过 `python start-preview.py` 预览当前版本。`REPORT.md` 记录的是 v0.3.12；当前变更及限制见 v0.3.14 目录内的 CHANGELOG、README 和验证报告。
