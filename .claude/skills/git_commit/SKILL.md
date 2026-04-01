---
name: git_commit
description: Git提交工具 - 自动提交并推送到远程仓库
---

## 说明
Git代码提交工具，支持自动推送到远程仓库

## 参数
- 目标目录（默认: 当前工作目录）
- `--no-push` 或 `-n`：仅提交，不推送
- `--push` 或 `-p`：强制推送（默认行为）

## 操作流程

### 阶段1：检查状态
1. `git status` - 查看更改状态
2. `git diff` - 查看具体更改内容
3. 排查低级书写错误（编译不报错但逻辑有问题）

### 阶段2：清理与暂存
4. 删除临时测试日志、NULL文件
5. 过滤不提交的文件（NULL、null、临时文件）
6. `git add` - 暂存有效更改

### 阶段3：提交
7. 编写精简的提交日志
8. `git commit` - 执行提交
9. `git log --oneline -1` - 确认提交成功

### 阶段4：推送（默认执行）
10. `git push` - 推送到远程仓库
11. 确认推送成功

## 常用命令
```bash
# 状态检查
git status
git diff
git diff --cached

# 暂存
git add <file>
git add -A

# 提交
git commit -m "提交日志"

# 推送
git push
git push -u origin <branch>  # 首次推送新分支

# 历史
git log --oneline -10
```

## 提交规范
```
【类型】【标题】
1. xxx
2. xxx
```

**类型：**
- `New` - 新增功能
- `Update` - 更新/优化
- `Bug` - Bug修复
- `Refactor` - 重构
- `Docs` - 文档

**注意：** 使用中文括号【】，不是英文[]

## 注意事项
- **严禁**添加网页链接（Co-Authored-By、Generated with等）
- 提交前确认当前分支正确
- 默认自动推送，使用 `--no-push` 跳过
- 推送失败时提示用户手动处理

## 用户任务
请提供要提交的目录或文件，我将执行Git提交并推送。
