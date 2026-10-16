# Reference Companion v0.3.12

入口：figure.json。当前版本专项增加肩根与袖根的支撑体量，保留v0.3.11的头颈连接。

预览：在本目录执行 python3 -m http.server 8000，然后打开 http://localhost:8000/preview.html 。请通过本地HTTP服务载入ES模块。

新增 shoulder-volume.js：近侧圆弧肩根、远侧较小的深色内撑，以及沿原上臂方向渐退的近端截面增厚。内层轮廓由原生Canvas生成，使用原肩部形变与骨链；没有增加图片运行依赖。

头颈图集、表情、白色板甲、外套、肩肘腕枢轴及动作参数保持v0.3.11设置。验证结果见 verification/shoulder-volume-validation.json；源码差异见 changes.patch。

已通过480帧软件几何对照与120组表情输出检查，尚未进行Electron实机验收。角色版权归原作者，代码许可见 LICENSE-AGPL-3.0.txt 和 NOTICE.md。
