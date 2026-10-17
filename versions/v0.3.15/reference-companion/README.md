# Reference Companion v0.3.15

入口 `figure.json`。在 Coopanion 的装扮页导入整个形象包 ZIP，或选择本目录。请勿只导入 `figure.json`。从 v0.3.14 延续原图胸口、肩根和尾巴修正；本版只优化首次载入的表情图片解码。

表情控制器仅预载中性表情与必需的眼部素材；其他表情首次使用时异步加载，加载期间暂用中性表情。全部 PNG、原图、纹理尺寸、头颈、服装与动作保持不变。首次使用某个表情可能有短暂延迟。ZIP 体积不会按内存节省比例缩小：主要减少的是启动时的解码量。

软件组件验证：480 帧动作及 120 组表情与 v0.3.14 对照完全一致；182 张 PNG 逐字节不变。表情控制器首次加载从 156 张图片降到 22 张；按图片尺寸计算的 RGBA 展开量从约 529 MiB 降到约 43 MiB。这不是实测进程内存，也不是 Electron/GPU 实机验收。在仓库根目录运行 `node tools/verify-load.mjs` 可复验（需安装 `@napi-rs/canvas`）。详见 `verification/load-validation.json`；代码差异见 `changes.patch`。

若连内置 Coo 也显示失败，先重启 Coopanion 并单独测试内置形象；本包的优化无法修复应用渲染器或 GPU 的独立故障。
