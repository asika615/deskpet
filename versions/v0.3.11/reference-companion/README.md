# Reference Companion v0.3.11

入口：`figure.json`。保留全部运行依赖；当前补丁只处理头颈与领口衔接。

预览：在本目录执行 `python3 -m http.server 8000`，打开 http://localhost:8000/preview.html 。请通过本地 HTTP 服务载入 ES 模块，不要直接双击 HTML。

`collar-connection.js` 以原立绘颈环与中央领口像素重新组装局部运行图集，并用局部网格将脖环下缘接入胸口。两侧仅增加简洁的领口承接底色；原肩部骨链与形变仍由原代码负责。

Head 全局比例与位置、头壳轮廓、表情组件、头发、wave 肩肘腕、板甲与外套文件保持原样。所有 PNG 源文件与 v0.3.10 相同；变化发生在局部图集合成与 torso 顶端网格。

验证：`verification/neck-connection-validation.json`。软件组件渲染、480 帧几何对照及 120 组表情输出检查通过；未进行 Electron 实机导入验证。

角色版权归原作者，代码许可见 LICENSE-AGPL-3.0.txt 与 NOTICE.md。
