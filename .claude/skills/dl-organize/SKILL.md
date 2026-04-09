---
name: dl-organize
description: 资源下载整理工具 - 从下载服务器获取游戏资源文件（图片/序列帧/切图），自动分类整理到项目目录并更新数据表。当用户提供下载链接（包含 localhost:9527/dl/ 的URL）或提到"下载资源"、"整理图片"、"从服务器下载"、"项目X的序列帧"、"项目X的切图"、"项目X的背景图"时使用此skill。也适用于用户提到需要将新角色、怪物、平台、UI图片添加到项目中的场景。
---

# 资源下载整理工作流

## 概述

从下载服务器获取游戏资源，通过交互式问答确定资源类型和归属，自动转换图片规格，整理到正确的项目目录，并更新对应的数据表。

## 服务器地址

下载服务器基础地址：`http://localhost:9527/dl/admin_all585369`

| URL模式 | 说明 |
|---------|------|
| `.../dl/admin_all585369` | 浏览页面，展示文件列表 |
| `.../dl/admin_all585369/3/sprites/xxx` | 序列帧/角色/怪物目录 → ZIP下载 |
| `.../dl/admin_all585369/3/sprites/xxx/file.png` | 序列帧文件 → 直接下载 |
| `.../dl/admin_all585369/3/splits/xxx` | 切图/背景图目录 → ZIP下载 |
| `.../dl/admin_all585369/3/splits/xxx/file.png` | 切图文件 → 直接下载 |
| `.../dl/admin_all585369/browse/3/sprites` | 浏览序列帧子目录页面 |
| `.../dl/admin_all585369/browse/3/splits` | 浏览切图子目录页面 |

**目录区分**：
- `3/sprites/` - 序列帧、角色、怪物资源
- `3/splits/` - 切图、背景图、单张图片资源

获取目录列表用API：
```bash
# 序列帧/角色/怪物
curl -s "http://localhost:9527/dl/admin_all585369/api/list?path=3/sprites"

# 切图/背景图
curl -s "http://localhost:9527/dl/admin_all585369/api/list?path=3/splits"
```

**重要**：URL中的 `admin_all585369` 是认证密钥，不要替换或省略。

## 项目路径检测

**重要**：所有路径均基于**实际游戏项目目录**动态检测，**禁止使用硬编码绝对路径**。

### 检测规则

1. **定位游戏项目根目录**：在当前工作空间中递归查找包含 `tables/Character.txt` 的子目录，该子目录即为游戏项目根目录
2. **项目名称**：使用找到的目录名作为项目标识（如 `jump-tower-game`）
3. **临时目录**：`{项目根目录}/images/_temp`
4. **资源目录**：
   - 角色目录：`{项目根目录}/images/characters/`
   - 怪物目录：`{项目根目录}/images/monsters/`
   - 平台目录：`{项目根目录}/images/platforms/`
   - UI目录：`{项目根目录}/images/ui_main/`
5. **数据表**：
   - 角色表：`{项目根目录}/tables/Character.txt`
   - 怪物表：`{项目根目录}/tables/Monsters.txt`
6. **转换脚本**：相对于skill目录，即 `{skill目录}/convert_sprite.py`

### 执行步骤

**步骤0 - 项目根目录检测（必须首先执行）**：

1. 使用 Glob 递归查找包含 `tables/Character.txt` 的目录：
   ```bash
   Glob pattern: "**/tables/Character.txt"
   ```

2. 从返回路径中提取项目根目录：
   - 例如：`jump-tower-game\tables\Character.txt` → 项目根目录为 `jump-tower-game`
   - **注意**：这可能是工作空间的子目录，不要使用工作空间本身作为项目根目录

3. **验证项目根目录**（关键步骤）：
   ```bash
   ls "{项目根目录}/images/"
   # 确认存在 characters/ monsters/ platforms/ ui_main/ 等目录
   ```

4. 将项目根目录路径保存到变量中，**后续所有路径必须使用这个项目根目录**

## 工作流程

### 步骤0（前置）：项目根目录检测

见上方"项目路径检测"章节。**必须首先执行并验证**，后续所有步骤中的 `{项目根目录}` 均指此处找到的目录。

### 步骤1：清理临时目录

```bash
rm -rf "{项目根目录}/images/_temp"
mkdir -p "{项目根目录}/images/_temp"
```

### 步骤2：下载资源

**根据用户提到的资源类型确定正确的服务器目录**：
- 用户说"序列帧"、"角色"、"怪物" → 浏览/下载 `3/sprites/`
- 用户说"切图"、"背景图"、"图片"、"Bg" → 浏览/下载 `3/splits/`

先通过API浏览对应目录内容：
```bash
# 序列帧/角色/怪物
curl -s "http://localhost:9527/dl/admin_all585369/api/list?path=3/sprites"

# 切图/背景图
curl -s "http://localhost:9527/dl/admin_all585369/api/list?path=3/splits"
```

根据用户提供的信息选择下载方式：

**场景A - 整个sprites目录下载（ZIP包）**：
```bash
curl -L -o "{项目根目录}/images/_temp/download.zip" "http://localhost:9527/dl/admin_all585369/3/sprites"
cd "{项目根目录}/images/_temp" && unzip -o download.zip
rm download.zip
```

**场景B - 单个子目录下载（sprites）**：
```bash
curl -L -o "{项目根目录}/images/_temp/download.zip" "http://localhost:9527/dl/admin_all585369/3/sprites/<子目录名>"
```

**场景C - 单文件下载（sprites）**：
```bash
curl -L -o "{项目根目录}/images/_temp/<文件名>" "http://localhost:9527/dl/admin_all585369/3/sprites/<路径>/<文件名>"
```

**场景D - 切图/背景图目录下载（splits）**：
```bash
curl -L -o "{项目根目录}/images/_temp/download.zip" "http://localhost:9527/dl/admin_all585369/3/splits/<子目录名>"
```

**场景E - 切图/背景图单文件下载（splits）**：
```bash
curl -L -o "{项目根目录}/images/_temp/<文件名>" "http://localhost:9527/dl/admin_all585369/3/splits/<路径>/<文件名>"
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
   查看目录：[子目录名/]({项目名}/images/_temp/<子目录名>/)
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
mkdir -p "{项目根目录}/images/characters/<英文名>"
cp -r {项目根目录}/images/_temp/<子目录名>/* {项目根目录}/images/characters/<英文名>/
```

**移动完成后自动重命名帧图文件为统一格式** `jump_0.png`, `jump_1.png`, ...（按实际帧数）：
```bash
cd "{项目根目录}/images/characters/<英文名>"

# 删除meta.json等非帧图文件
rm -f meta.json

# 使用Python脚本批量重命名为 jump_0.png, jump_1.png, ...
python -c "
import os
import re
import glob

files = sorted(glob.glob('*.png'))
print('Found files:', [f for f in files])

index = 0
for f in files:
    new_name = f'jump_{index}.png'
    if f != new_name:
        os.rename(f, new_name)
        print(f'Rename: {f} -> {new_name}')
    index += 1

print(f'Total frames renamed: {index}')
"
```

**怪物**：
```bash
mkdir -p "{项目根目录}/images/monsters/<英文名>"
cp -r {项目根目录}/images/_temp/<子目录名>/* {项目根目录}/images/monsters/<英文名>/
```

**平台/UI**：
```bash
cp {项目根目录}/images/_temp/* {项目根目录}/images/<类型目录>/
```

移动完成后清理临时目录：
```bash
rm -rf "{项目根目录}/images/_temp"
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

#### jump-tower-game 项目现有图片规格参考

| 类型 | 目录 | 现有规格 | 说明 |
|------|------|----------|------|
| 角色序列帧 | `images/characters/*/` | **128x128** | 正方形，所有角色统一规格 |
| 怪物追击帧 | `images/monsters/boss/chase/` | **539x480** | Boss专属大尺寸帧 |
| 平台（半成品） | `images/platforms/` (candy/cloud/grass/ice/metal/rock/sand/wood) | **150x40** | 横条形短尺寸 |
| 平台（成品） | `images/platforms/` (platform_ice/moving/normal/rock) | **512x128** | 横条形长尺寸 |
| UI背景 | `images/ui_main/` (bg_main/bg_main_temp) | **720x1280** | 竖屏背景图 |
| UI商店背景 | `images/ui_main/` (bg_shop) | **713x1280** | 商店背景图 |
| UI图标 | `images/ui_main/` (icon_character/coin/leaderboard/shop) | **128x128** | 正方形图标 |


#### 规格转换选项

根据**目标目录类型**动态确定基础规格，再以倍率为选项：

**角色序列帧 / 怪物帧 / 平台 / UI图标**（正方形或短宽比）：
- **1x** - 保持原始尺寸（不放大）
- **2x** - 放大至 2 倍
- **4x** - 放大至 4 倍
- **自定义** - 用户通过 Other 输入最终尺寸，格式如 `256x256` 或 `1024`

**UI背景图**（竖屏 720x1280 / 713x1280）：
- **1x** - 保持原始尺寸（不放大）
- **2x** - 放大至 2 倍
- **自定义** - 用户通过 Other 输入最终尺寸

选择倍率后，根据基础尺寸计算最终尺寸，再执行转换：
```bash
python "{skill目录}/convert_sprite.py" "{目标目录}" <最终宽度>x<最终高度>
```

对**整个目标类型目录**递归执行转换：

```bash
python "{skill目录}/convert_sprite.py" "{项目根目录}/images/characters" <尺寸>
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

- **【关键】项目根目录 ≠ 工作空间**：工作空间（如 `e:/weixingame`）可能包含多个游戏项目，实际项目根目录是其中的子目录（如 `jump-tower-game`）。**必须先通过 Glob 找到包含 `tables/Character.txt` 的目录作为项目根目录**
- 下载前务必先清理临时目录，避免上次残留文件干扰
- 图片规格转换放在**最后一步**，所有文件移动和数据表更新完成后再执行
- 询问中文名时，打印子目录的可点击链接让用户预览
- 移动文件后检查目标目录确认文件完整
- 数据表用TAB分隔，保持格式一致
- 如果下载URL无法访问，提示用户检查服务器是否正常运行
- 对于 platforms 和 ui_main 类型，直接放入目录即可，不需要创建子文件夹，也不需要更新数据表
- **下载完成后、转换前**：使用 `ls "{项目根目录}/images/ui_main/"` 或类似命令确认文件已正确放置
