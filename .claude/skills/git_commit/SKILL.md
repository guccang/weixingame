---
name: git_commit
description: Git提交工具
---

## 说明
Git代码提交工具

## 参数
- 目标目录（默认: 当前工作目录）

## 操作步骤
1. 使用 `git status` 查看更改状态
2. 使用 `git diff` 查看具体文件的更改内容
3. 帮助排查低级书写错误（编译不报错但逻辑有问题）
4. 删除临时测试日志
5. 尝试删除NULL文件，并且不提交NULL、null文件
6. 如果有新增/删除文件，一并提交
7. 编写精简的Git提交日志并提交

## 常用命令示例
```bash
# 查看更改状态
git status

# 查看所有diff
git diff

# 查看特定文件的diff
git diff -- <file>

# 查看已暂存的更改
git diff --cached

# 添加文件到暂存区
git add <file>

# 添加所有更改
git add -A

# 提交更改
git commit -m "提交日志"

# 查看提交历史
git log --oneline -10

# 推送到远程
git push
```

## 提交规范
注意括号格式，一定是【】不是[]
```
【New】【标题】
1. xxx
2. xxx
```
- 第一个括号: New(新增)/Update(更新)/Bug(Bug修复)
- 第二个括号: 功能标题
- 内容: 精简描述

## 注意事项
- **严禁**添加网页链接（如 Co-Authored-By、Generated with等）
- 仅包含提交日志，无其他额外信息
- 提交前确认当前分支是否正确

## 用户任务
请提供要提交的目录或文件，我将执行Git提交。
