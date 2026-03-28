---
name: py_build
description: Python脚本构建打包
---

## 说明
使用PyInstaller将Python脚本打包成exe文件

## 参数
- 目标Python文件或文件所在目录

## 操作步骤
1. cd到目标目录
2. 执行 `python -m PyInstaller --onefile --name {exe名} {脚本名}.py`
3. 打包完成后拷贝exe到当前脚本目录
4. 删除打包产生的临时文件（build、spec等）

## 环境
- Windows系统
- 需要安装PyInstaller

## 用户任务
请提供要打包的Python文件路径，我将帮你执行打包。
