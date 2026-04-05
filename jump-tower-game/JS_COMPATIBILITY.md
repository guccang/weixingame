# JavaScript 兼容性规范

## 微信小游戏环境限制

微信小游戏 JavaScript 引擎**不支持 ES2020+ 特性**。

### 禁用的语法特性

| 特性 | 不支持 | 替代方案 |
|------|--------|----------|
| 可选链 `?.` | `obj?.prop` | `obj && obj.prop` |
| 空值合并 `??` | `a ?? b` | `a != null ? a : b` |
| 逻辑或赋值 `||=` | `a \|\|= b` | `a = a \|\| b` |
| for...of 循环 | 部分支持 | 使用传统 `for(var i=0; i<len; i++)` |

### 代码示例

```javascript
// ❌ 错误
const value = this.game.someObj?.property;
const btn = this.game.bottomBtnArea?.character;

// ✅ 正确
const obj = this.game.someObj;
const value = obj && obj.property;
const btnArea = this.game.bottomBtnArea;
const btn = btnArea && btnArea.character;
```

### 相关文件修复记录

- `js/ui/panelManager.js` - 可选链已修复
- `js/ui/mainUI.js` - 可选链已修复

### 代码审查检查清单

新增 `.js` 文件时，检查是否使用了：
- [ ] 可选链操作符 `?.`
- [ ] 空值合并 `??`
- [ ] 逻辑或赋值 `||=`
- [ ] 其他 ES2020+ 新特性

如果发现，请替换为兼容写法。
