class UIRegistry {
  constructor() {
    this.beginFrame('boot');
  }

  beginFrame(screenId) {
    this.screenId = screenId || 'unknown';
    this.entries = [];
    this.byId = {};
    this.groups = {};
  }

  register(id, rect, meta) {
    if (!id || !rect) return null;

    const normalized = this._normalizeRect(rect);
    if (!normalized) return null;

    const entry = {
      id: id,
      rect: normalized,
      meta: meta || {}
    };

    this.entries.push(entry);
    this.byId[id] = entry;

    if (entry.meta.groupId) {
      if (!this.groups[entry.meta.groupId]) {
        this.groups[entry.meta.groupId] = [];
      }
      this.groups[entry.meta.groupId].push(entry);
    }

    return entry;
  }

  registerList(groupId, items, metaFactory) {
    if (!Array.isArray(items)) return [];

    const entries = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const meta = typeof metaFactory === 'function' ? metaFactory(item, i) : (metaFactory || {});
      const entry = this.register(groupId + ':' + i, item, Object.assign({}, meta, {
        groupId: groupId,
        index: i
      }));
      if (entry) {
        entries.push(entry);
      }
    }
    return entries;
  }

  get(id) {
    return this.byId[id] || null;
  }

  getGroup(groupId) {
    return this.groups[groupId] || [];
  }

  hitTest(x, y, predicate) {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      if (!this._contains(entry.rect, x, y)) continue;
      if (typeof predicate === 'function' && !predicate(entry)) continue;
      return entry;
    }
    return null;
  }

  _contains(rect, x, y) {
    return !!rect &&
      x >= rect.x &&
      x <= rect.x + rect.w &&
      y >= rect.y &&
      y <= rect.y + rect.h;
  }

  _normalizeRect(rect) {
    const width = typeof rect.w === 'number' ? rect.w : rect.width;
    const height = typeof rect.h === 'number' ? rect.h : rect.height;

    if (typeof rect.x !== 'number' || typeof rect.y !== 'number' ||
        typeof width !== 'number' || typeof height !== 'number') {
      return null;
    }

    return {
      x: rect.x,
      y: rect.y,
      w: width,
      h: height
    };
  }
}

module.exports = UIRegistry;
