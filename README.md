# Reference Companion 桌宠工程

这是供 [Coopanion](https://github.com/Pal-AI-Lab/Coopanion) 使用的参考角色工程工作区，不是独立的 Electron 应用。当前版本为 **v0.3.13**：肩根恢复为原图取样的斜向轮廓，撤回 v0.3.12 的扩肩和袖根增厚，同时保留此前的头颈连接、表情与动作系统。

## 版本与目录

| 路径 | 用途 |
| --- | --- |
| `versions/v0.3.13/reference-companion/` | 当前版本；`figure.json` 是角色清单入口 |
| `versions/v0.3.12/reference-companion/` | 上一版本，供肩部形状对照 |
| `versions/v0.3.11/reference-companion/` | 保留的历史头颈连接基线 |
| `references/original.png` | 原始立绘参考 |
| `project.json` | 当前版本与对照版本的路径配置 |
| `review/`、`handoff/` | 历史对照图、报告与校验信息 |

## 本地预览

在仓库根目录运行：

```sh
python start-preview.py
```

然后打开 `http://127.0.0.1:8000/preview.html`。如果系统使用 `python3` 命令，请运行 `python3 start-preview.py`。预览脚本读取 `project.json` 的 `current_project`，并从当前版本目录启动本地 HTTP 服务；不要直接以 `file://` 打开页面。

导入 Coopanion 时，保持 `versions/v0.3.13/reference-companion/` 内的 `figure.json`、脚本、图片及子目录在一起，并按宿主的角色导入方式打包该目录。角色版本内的 [README](versions/v0.3.13/reference-companion/README.md) 和 [CHANGELOG](versions/v0.3.13/reference-companion/CHANGELOG.md) 记录了本次改动。

## 验证与限制

随附的 [v0.3.13 验证报告](versions/v0.3.13/reference-companion/verification/shoulder-shape-validation.json) 记录了软件渲染下 480 帧动作与 120 组表情检查，以及未修改素材的对照结果。它不等同于浏览器 GPU 或 Electron 实机导入验收。仓库根目录的 `REPORT.md` 是 v0.3.12 的历史报告；`tools/verify.mjs` 也是针对 v0.3.11 与 v0.3.12 的旧版对照工具，不应作为 v0.3.13 的完整验收结论。

## 许可与素材

代码沿用 Coopanion 的 **AGPL-3.0-or-later** 许可，详见当前版本内的 [许可证](versions/v0.3.13/reference-companion/LICENSE-AGPL-3.0.txt) 与 [来源说明](versions/v0.3.13/reference-companion/NOTICE.md)。角色原图由用户提供，原作者未标注；图片权利仍归原权利人，不因代码许可而自动获得再分发授权。
