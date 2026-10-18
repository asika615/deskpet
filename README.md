# Reference Companion 桌宠工程

这是供 [Coopanion](https://github.com/Pal-AI-Lab/Coopanion) 使用的参考角色工程工作区，不是独立的 Electron 应用。当前版本为 **v0.3.18**：在 v0.3.16 的轻量渲染基础上，为双臂加入原生肩→肘→腕连续驱动，并保留原始 PNG、模型、表情、服装与板甲绑定。

## 版本与目录

| 路径 | 用途 |
| --- | --- |
| `versions/v0.3.18/reference-companion/` | 当前原生双臂动作版本；`figure.json` 是角色清单入口 |
| `versions/v0.3.16/reference-companion/` | 上一版轻量渲染基线，供动作与性能对照 |
| `versions/v0.3.15/reference-companion/` | 上一版本，供性能与画质对照 |
| `versions/v0.3.14/reference-companion/` | 历史胸口、肩部和尾巴修正版本 |
| `versions/v0.3.13/reference-companion/` | 历史紧凑造型调整前版本 |
| `versions/v0.3.12/reference-companion/` | 历史肩部体量版本 |
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

导入 Coopanion 时，使用 `dist/reference-companion-v0.3.18-native-arms.zip`，或选择 `versions/v0.3.18/reference-companion/` 整个目录；不要只导入 `figure.json`。导入后完全退出并重启 Coopanion，确保同 ID 的旧包被重新读取。角色版本内的 [README](versions/v0.3.18/reference-companion/README.md) 和 [CHANGELOG](versions/v0.3.18/reference-companion/CHANGELOG.md) 记录了本次改动。

## 验证与限制

随附的 [v0.3.18 原生窗口验证报告](versions/v0.3.18/reference-companion/verification/coopanion-validation.json) 记录了本机 Coopanion 的实际加载与动作调用。当前桌宠窗口可以加载 v0.3.18，`wave → jump → flap` 已通过；装扮页预览 iframe 仍可能出现 20 秒准备超时，不能把该页面超时等同于桌宠窗口动作失败。仓库根目录的 `REPORT.md` 和 `tools/verify.mjs` 是早期版本的历史报告与对照工具。

## 许可与素材

代码沿用 Coopanion 的 **AGPL-3.0-or-later** 许可，详见当前版本内的 [许可证](versions/v0.3.18/reference-companion/LICENSE-AGPL-3.0.txt) 与 [来源说明](versions/v0.3.18/reference-companion/NOTICE.md)。角色原图由用户提供，原作者未标注；图片权利仍归原权利人，不因代码许可而自动获得再分发授权。
