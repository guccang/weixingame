# Document Templates

Use these templates as structure guidance. Keep the final document concise and repo-specific.

## Template A: Standing Rules Doc

```md
# <Topic Title>

一句话说明这份规则约束什么问题域。

适用范围：

- `path/a.js`
- `path/b.js`

## 1. <Rule Title>

规则：

- ...

原因：

- ...

当前实现：

- ...

新增代码时要求：

- ...

## 2. <Rule Title>

...

## 最小检查清单

- ...
- ...
- ...
```

## Template B: One-Off Incident Doc

```md
# <Date> <Incident Title>

## 症状

- ...

## 触发条件

- ...

## 根因

- ...

## 修复

- ...

## 后续规则

- ...

## 验证

- ...
```

## Heuristics

- Repeated or cross-cutting issue -> write or extend a standing rules doc.
- Highly local or time-bound issue -> write a dated incident doc.
- If a rule can be stated as "must/must not", it usually belongs in a standing rules doc.
- If the lesson only makes sense with a specific timeline, it may belong in an incident doc.
