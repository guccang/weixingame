---
name: dl-organize
description: 资源下载整理工具 - 从下载服务器获取游戏资源文件（图片/序列帧），自动分类整理到项目目录并更新数据表。当用户提供下载链接（包含 localhost:9527/dl/ 的URL）或提到"下载资源"、"整理图片"、"从服务器下载"、"项目X的序列帧"时使用此skill。也适用于用户提到需要将新角色、怪物、平台、UI图片添加到项目中的场景。
---

# 资源下载整理工作流

## 概述

从下载服务器获取游戏资源，通过交互式问答确定资源类型和归属，自动转换图片规格，整理到正确的项目目录，并更新对应的数据表。

## 服务器地址

下载服务器基础地址：`http://localhost:9527/dl/admin_all585369`

| URL模式 | 说明 |
|---------|------|
| `.../dl/admin_all585369` | 浏览页面，展示文件列表 |
| `.../dl/admin_all585369/3/sprites/xxx` | 目录 → 自动打包 ZIP 下载 |
| `.../dl/admin_all585369/3/sprites/xxx/file.png` | 文件 → 直接下载 |
| `.../dl/admin_all585369/browse/3/sprites` | 浏览子目录页面 |

获取目录列表用API：`curl -s "http://localhost:9527/dl/admin_all585369/api/list?path=3/sprites"`

**重要**：URL中的 `admin_all585369` 是认证密钥，不要替换或省略。

## 项目路径

| 用途 | 路径 |
|------|------|
| 临时目录 | `D:\GitWechatGame\jump-tower-game\images\_temp` |
| 角色目录 | `D:\GitWechatGame\jump-tower-game\images\characters\` |
| 怪物目录 | `D:\GitWechatGame\jump-tower-game\images\monsters\` |
| 平台目录 | `D:\GitWechatGame\jump-tower-game\images\platforms\` |
| UI目录 | `D:\GitWechatGame\jump-tower-game\images\ui_main\` |
| 角色表 | `D:\GitWechatGame\jump-tower-game\tables\Character.txt` |
| 怪物表 | `D:\GitWechatGame\jump-tower-game\tables\Monsters.txt` |
| 转换脚本 | `D:\GitWechatGame\.claude\skills\dl-organize\convert_sprite.py` |

## 工作流程

### 步骤1：清理临时目录

```bash
rm -rf "D:/GitWechatGame/jump-tower-game/images/_temp"
mkdir -p "D:/GitWechatGame/jump-tower-game/images/_temp"
```

### 步骤2：下载资源

先通过API浏览目录内容，确认有哪些子目录：
```bash
curl -s "http://localhost:9527/dl/admin_all585369/api/list?path=3/sprites"
```

根据用户提供的信息选择下载方式：

**场景A - 整个目录下载（ZIP包）**：
```bash
curl -L -o "D:/GitWechatGame/jump-tower-game/images/_temp/download.zip" "http://localhost:9527/dl/admin_all585369/3/sprites"
cd "D:/GitWechatGame/jump-tower-game/images/_temp" && unzip -o download.zip
rm download.zip
```

**场景B - 单个子目录下载**：
```bash
curl -L -o "D:/GitWechatGame/jump-tower-game/images/_temp/download.zip" "http://localhost:9527/dl/admin_all585369/3/sprites/<子目录名>"
```

**场景C - 单文件下载**：
```bash
curl -L -o "D:/GitWechatGame/jump-tower-game/images/_temp/<文件名>" "http://localhost:9527/dl/admin_all585369/3/sprites/<路径>/<文件名>"
```

下载完成后用 `ls` 确认临时目录内容。

### 步骤3：询问图片类型

使用 AskUserQuestion 询问资源类型：
1. **角色（characters）** - 游戏角色序列帧
2. **怪物（monsters）** - 怪物、Boss相关资源
3. **平台（platforms）** - 游戏平台、地面砖块等
4. **UI主界面（ui_main）** - 界面图标、背景等UI元素

### 步骤4：逐个询问角色中文名（仅角色/怪物类型）

对临时目录中的**每个子目录**，依次执行：

1. 打印该子目录的可点击链接（使用相对路径 markdown 格式）：
   ```
   **[N/M] <子目录名>**
   查看目录：[子目录名/](jump-tower-game/images/_temp/<子目录名>/)
   ```

2. 使用 AskUserQuestion 询问该角色的中文名

3. 根据中文名自动生成英文文件夹名（拼音或英文翻译）

4. 如果目标目录已存在同名角色（如 ironman 已存在），提示用户将会覆盖更新

**英文名生成规则**：
- 有明确英文对应：如 钢铁侠→ironman, 蝙蝠侠→batman, 绿色巨人→green_giant
- 中文拼音：如 程序→chengxu, 护士→hushi
- 组合翻译：如 刀盾狗→daodundog, 健身教练→coach_fitness
- 全小写，下划线分隔

### 步骤5：移动文件到目标目录

**角色**：
```bash
mkdir -p "D:/GitWechatGame/jump-tower-game/images/characters/<英文名>"
cp -r D:/GitWechatGame/jump-tower-game/images/_temp/<子目录名>/* D:/GitWechatGame/jump-tower-game/images/characters/<英文名>/
```

**怪物**：
```bash
mkdir -p "D:/GitWechatGame/jump-tower-game/images/monsters/<英文名>"
cp -r D:/GitWechatGame/jump-tower-game/images/_temp/<子目录名>/* D:/GitWechatGame/jump-tower-game/images/monsters/<英文名>/
```

**平台/UI**：
```bash
cp D:/GitWechatGame/jump-tower-game/images/_temp/* D:/GitWechatGame/jump-tower-game/images/<类型目录>/
```

移动完成后清理临时目录：
```bash
rm -rf "D:/GitWechatGame/jump-tower-game/images/_temp"
```

### 步骤6：更新数据表

#### 角色表 - Character.txt

表格格式（TAB分隔）：
```
INT	STRING	STRING
#序号	角色名字	跳跃序列帧文件夹
#Id	Name	JumpFolder
1	钢铁侠	ironman
```

新增角色行：`<自增ID>\t<中文名>\t<英文名>`
- ID从现有最大ID+1开始
- JumpFolder字段值与 images/characters/ 下的文件夹名一致
- 使用 Edit 工具在最后一行数据之后追加新行

#### 怪物表 - Monsters.txt

表格格式（TAB分隔）：
```
INT	STRING	INT	INT	INT	STRING	BOOL	STRING	STRING
#序号	怪物名称	生命值	攻击力	移动速度	追击动作路径	是否Boss	出现条件	掉落奖励
#Id	Name	Hp	Attack	Speed	ChasePath	IsBoss	SpawnCond	DropReward
```

新增怪物行时询问字段（提供合理默认值）：
- 生命值(Hp)：默认100，攻击力(Attack)：默认10，移动速度(Speed)：默认3
- 追击动作路径：`images/monsters/<英文名>/chase`
- 是否Boss：默认false，出现条件/掉落奖励：默认留空

### 步骤7：图片规格转换（最后执行）

**所有文件移动和数据表更新完成后**，统一询问用户需要转换的图片规格。

使用 AskUserQuestion 询问：
- **128x128** - 小尺寸序列帧
- **256x256** - 中尺寸序列帧
- **512x512** - 大尺寸序列帧
- **自定义** - 用户通过 Other 输入，格式如 `256x128` 或 `320`

然后对**整个目标类型目录**递归执行转换：

```bash
python "D:/GitWechatGame/.claude/skills/dl-organize/convert_sprite.py" "D:/GitWechatGame/jump-tower-game/images/characters" <尺寸>
```

尺寸参数格式：
- 正方形：`128`、`256`、`512`
- 矩形：`256x128`

**仅角色和怪物类型需要转换**，平台和UI跳过此步骤。

### 步骤8：确认完成

展示总结：
- 下载了什么资源（来源目录、文件数量）
- 放到了哪个目录（每个角色的中文名→英文名映射）
- 图片规格转换结果
- 数据表更新内容（新增行）
- 如有覆盖更新的角色需标注

## 注意事项

- 下载前务必先清理临时目录，避免上次残留文件干扰
- 图片规格转换放在**最后一步**，所有文件移动和数据表更新完成后再执行
- 询问中文名时，打印子目录的可点击链接让用户预览
- 移动文件后检查目标目录确认文件完整
- 数据表用TAB分隔，保持格式一致
- 如果下载URL无法访问，提示用户检查服务器是否正常运行
- 对于 platforms 和 ui_main 类型，直接放入目录即可，不需要创建子文件夹，也不需要更新数据表
