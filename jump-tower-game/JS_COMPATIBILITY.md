# JavaScript 兼容性规范

## 微信小游戏环境限制

微信小游戏 JavaScript 引擎**不支持 ES2020+ 特性**，且 `const`/`let` 是块级作用域。

### 禁用的语法特性

| 特性 | 不支持 | 替代方案 |
|------|--------|----------|
| 可选链 `?.` | `obj?.prop` | `obj && obj.prop` |
| 空值合并 `??` | `a ?? b` | `a != null ? a : b` |
| 逻辑或赋值 `||=` | `a \|\|= b` | `a = a \|\| b` |
| 块级作用域 `const/let` | 块外不可访问 | 使用 `var` 声明函数级变量 |

### 代码示例

```javascript
// ❌ 错误 - 可选链
const value = this.game.someObj?.property;

// ❌ 错误 - 块级作用域
handleTouch(x, y) {
  if (someCondition) {
    const pm = this.game.panelManager;
  }
  if (!pm.isAnyOpen()) {  // ❌ pm is undefined!
    // ...
  }
}

// ✅ 正确
var obj = this.game.someObj;
const value = obj && obj.property;

// ✅ 正确 - 函数级变量
handleTouch(x, y) {
  var pm = this.game.panelManager;
  if (someCondition) {
    // pm 可用
  }
  if (!pm.isAnyOpen()) {  // ✅ pm 可用
    // ...
  }
}
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
