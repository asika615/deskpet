# 当前状态

当前版本：v0.3.18。性能与素材对照：v0.3.16。仓库保留更早历史版本；用户提供的 ZIP 未改动。

本次更新：沿用 v0.3.16 的轻量渲染管线，为双臂加入原生肩肘腕连续驱动、平滑动作切换和 greet→wave 映射。保留全部 PNG、模型、表情与服装。形象包在 `dist/reference-companion-v0.3.18-native-arms.zip`。

软件验证：用户包内的原生动作验证记录显示 25 条动作路径、双臂连续切换与 120 组稳定表情案例均已覆盖；详见 `versions/v0.3.18/reference-companion/verification/all-arms-validation.json`。本机 Coopanion 窗口已实际加载并执行 `wave → jump → flap`；装扮页 iframe 仍有独立的 20 秒准备超时，详见 `coopanion-validation.json`。

实机：本机 Coopanion 0.2.4 已加载 v0.3.18，当前状态为 `reference-companion`、30 FPS、未锁定帧率。2026-10-19 00:27 通过控制台触发 `pet_act`，运行记录显示动作调用成功且无异常回退。尚未测量其他硬件上的帧率或实际丢帧。

接续请读取 `README.md`、`CURRENT.md`、`project.json` 与 v0.3.18 目录内的说明。默认从 v0.3.18 继续，不回退到历史临时路径。`REPORT.md` 是 v0.3.12 的历史报告。

仓库包含 v0.3.11 至 v0.3.18、原图、历史报告、对照图、工具和校验信息。旧版保存回执仅作历史记录，不代表当前 GitHub 状态。
