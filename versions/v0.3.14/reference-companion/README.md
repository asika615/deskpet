# Reference Companion v0.3.14

入口 `figure.json`。唯一美术基准为 `original.png`。本版从 v0.3.13 继续，只修改三处：

1. 胸口：`reference-compact.js` 从原图恢复中央面料与下缘的平整色块，保留精细化束带与扣件，保留躯干 alpha 和网格。
2. 肩根：同一模块移除少量错位的躯干覆盖，只在现有肩部有覆盖的位置生效。没有增加肤色图层、扩大肩根或修改袖根形变。
3. 尾巴：`tex/tailReference.png` 提取原立绘中可见的毛团像素，保留 RGB、原图尺寸与配准。模型更新该纹理路径与取样框，并在原 tailBend 之前增加静态内缘配准层（一般最大 24 原图像素，原手套切口对应 y=940–1030 的隐藏区另加最多 80 px，向外侧渐减为零），让原图被旧外套切掉的边界藏入当前服装。原尾根枢轴、深度与摆动函数不变。

Head、脸型、五官、表情、头颈连接模块、白色板甲、外套、wave 参数均未改。旧 PNG 原文件全部保留。新尾巴的根部仍藏在身体与板甲后面；原图中被衣服挡住的毛发没有重画。

根目录运行 `python3 start-preview.py`。验证方法、实际结果见 `verification/compact-validation.json`；差异见 `changes.patch`。软件渲染不等于 GPU/Electron 实机验收。
