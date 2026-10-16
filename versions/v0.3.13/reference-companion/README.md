# Reference Companion v0.3.13

入口：`figure.json`。以 original.png 为肩部静态形状基准，撤回 v0.3.12 的程序肤色块和两侧袖根扩张。

`reference-shoulder.js` 只从原图取样，不重画可见皮肤或增加描边。原肩根像素与袖根共用已有形变；窄的深色内衬下缘随衣身与固定板甲，上缘贴合侧发。肩部局部上缘配准到已修正的领口与侧发。躯干只移除重复的近侧肤色底层，领口和胸口主体保持原样。

Head、五官、白色板甲、外套结构、肩肘腕枢轴、wave 动作参数和 37 个公开指令不变。181 张既有 PNG 均未修改。

在仓库根目录运行 `python3 start-preview.py`，打开打印出的本地地址。导入 Coopanion 时使用包含此目录内容的 ZIP。

验证见 `verification/shoulder-shape-validation.json`；代码差异见 `changes.patch`。软件渲染检查不等于 Electron 实机验收。现有精细化板甲上缘与原图不同，固定板甲前提下以窄内衬承接，未假称外层服装逐像素还原。
