(function() {
  var DEVICES = {
    '375x667': { w: 375, h: 667 },
    '375x812': { w: 375, h: 812 },
    '390x844': { w: 390, h: 844 },
    '414x896': { w: 414, h: 896 },
    '768x1024': { w: 768, h: 1024 }
  };

  var ELEMENT_DEFAULTS = {
    glassPanel: { size: { width: 320, height: 400 }, style: { radius: 22 } },
    text: { size: { width: 200, height: 30 }, style: { fontSize: 16, fontWeight: '700', textAlign: 'center', color: '$cardLabel', text: 'Sample Text' } },
    actionButton: { size: { width: 180, height: 50 }, style: { fontSize: 18, text: 'Button' } },
    closeButton: { size: { width: 26, height: 26 } },
    badge: { size: { width: 120, height: 30 }, style: { text: 'Badge' } },
    iconTile: { size: { width: 68, height: 78 }, style: { label: 'Icon' } },
    metricCard: { size: { width: 140, height: 60 }, style: { label: 'Label', value: '100' } },
    roundRect: { size: { width: 200, height: 100 }, style: { radius: 14, fill: '$cardFill' } },
    rect: { size: { width: 200, height: 100 }, style: { fill: 'rgba(0,0,0,0.5)' } },
    image: { size: { width: 120, height: 120 }, style: {} },
    scrollList: { size: { width: 300, height: 280 }, style: {} },
    flex: { size: { width: '100%', height: 100 }, flex: { direction: 'row', gap: 8, justify: 'center', align: 'center' } }
  };

  function Editor() {
    this.elements = [];
    this.selectedId = null;
    this.themeId = 'mist';
    this.deviceKey = '375x812';
    this.device = DEVICES['375x812'];
    this.zoom = 1;
    this.undoStack = [];
    this.redoStack = [];
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isResizing = false;
    this.resizeHandle = null;

    this.canvas = document.getElementById('editor-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.treePanel = new TreePanel(this);
    this.propPanel = new PropertyPanel(this);

    this._initCanvas();
    this._bindEvents();

    var initialLayout = document.getElementById('layout-select').value;
    if (initialLayout) {
      this._loadLayoutFile(initialLayout);
    } else {
      this._loadDemo();
      this.renderAll();
    }
  }

  Editor.prototype._initCanvas = function() {
    var dpr = window.devicePixelRatio || 1;
    var area = document.getElementById('canvas-area');
    var areaH = area.clientHeight - 24;
    var areaW = area.clientWidth - 24;
    var scale = Math.min(1, areaH / this.device.h, areaW / this.device.w);
    this.zoom = scale;

    this.canvas.width = this.device.w * dpr;
    this.canvas.height = this.device.h * dpr;
    this.canvas.style.width = Math.floor(this.device.w * scale) + 'px';
    this.canvas.style.height = Math.floor(this.device.h * scale) + 'px';
    this.ctx.scale(dpr, dpr);
    document.getElementById('canvas-info').textContent = this.device.w + ' x ' + this.device.h + ' (' + Math.round(scale * 100) + '%)';
    document.getElementById('zoom-label').textContent = Math.round(scale * 100) + '%';
  };

  Editor.prototype._loadDemo = function() {
    this.elements = [
      {
        id: 'demoPanel', type: 'glassPanel',
        anchor: { x: 'center', y: 'top' }, offset: { x: 0, y: 76 },
        size: { width: 320, height: 440 },
        style: { radius: 22 }, children: []
      },
      {
        id: 'demoTitle', type: 'text',
        anchor: { x: 'center', y: 'top' }, offset: { x: 0, y: 100 },
        size: { width: 200, height: 30 },
        style: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '$cardLabel', text: 'Panel Title' }
      },
      {
        id: 'demoClose', type: 'closeButton',
        anchor: { x: 'right', y: 'top' }, offset: { x: -52, y: 88 },
        size: { width: 26, height: 26 }, style: {}
      },
      {
        id: 'demoBtn', type: 'actionButton',
        anchor: { x: 'center', y: 'top' }, offset: { x: 0, y: 440 },
        size: { width: 180, height: 50 },
        style: { fontSize: 18, text: 'Confirm' }
      }
    ];
  };

  Editor.prototype._loadLayoutFile = function(layoutId) {
    var self = this;
    var url = 'layouts/' + layoutId + '.json';
    fetch(url).then(function(res) {
      if (!res.ok) throw new Error('Layout not found: ' + layoutId);
      return res.json();
    }).then(function(config) {
      self.pushUndo();
      var result = importLayoutJSON(JSON.stringify(config));
      self.elements = result.elements;
      self.selectedId = null;
      self.renderAll();
    }).catch(function(err) {
      console.warn('fetch failed, trying embedded layouts:', err.message);
      if (window.EMBEDDED_LAYOUTS && window.EMBEDDED_LAYOUTS[layoutId]) {
        self.pushUndo();
        var result = importLayoutJSON(JSON.stringify(window.EMBEDDED_LAYOUTS[layoutId]));
        self.elements = result.elements;
        self.selectedId = null;
        self.renderAll();
      } else {
        alert('Load layout via HTTP server: python3 -m http.server 8080\nThen open http://localhost:8080');
      }
    });
  };

  Editor.prototype._bindEvents = function() {
    var self = this;

    document.getElementById('device-select').addEventListener('change', function(e) {
      self.deviceKey = e.target.value;
      self.device = DEVICES[e.target.value];
      self._initCanvas();
      self.renderAll();
    });

    document.getElementById('theme-select').addEventListener('change', function(e) {
      self.themeId = e.target.value;
      window._editorThemeId = e.target.value;
      renderThemeSwatches('theme-swatches', self.themeId, function(id) {
        self.themeId = id;
        window._editorThemeId = id;
        document.getElementById('theme-select').value = id;
        renderThemeSwatches('theme-swatches', id, arguments.callee);
        self.renderAll();
      });
      self.renderAll();
    });

    document.getElementById('layout-select').addEventListener('change', function(e) {
      var layoutId = e.target.value;
      if (!layoutId) {
        self.pushUndo();
        self._loadDemo();
        self.selectedId = null;
        self.renderAll();
        return;
      }
      self._loadLayoutFile(layoutId);
    });

    renderThemeSwatches('theme-swatches', this.themeId, function(id) {
      self.themeId = id;
      window._editorThemeId = id;
      document.getElementById('theme-select').value = id;
      renderThemeSwatches('theme-swatches', id, arguments.callee);
      self.renderAll();
    });

    var addBtn = document.getElementById('btn-add-element');
    var addMenu = document.getElementById('add-menu');
    addBtn.addEventListener('click', function(e) {
      var rect = addBtn.getBoundingClientRect();
      addMenu.style.left = rect.left + 'px';
      addMenu.style.top = rect.bottom + 4 + 'px';
      addMenu.style.display = addMenu.style.display === 'block' ? 'none' : 'block';
      e.stopPropagation();
    });

    addMenu.querySelectorAll('.item').forEach(function(item) {
      item.addEventListener('click', function() {
        self.addElement(item.dataset.type);
        addMenu.style.display = 'none';
      });
    });

    document.addEventListener('click', function() {
      addMenu.style.display = 'none';
    });

    this.canvas.addEventListener('mousedown', function(e) { self._onMouseDown(e); });

    window.addEventListener('resize', function() {
      self._initCanvas();
      self.renderCanvas();
    });
    this.canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
    this.canvas.addEventListener('mouseup', function(e) { self._onMouseUp(e); });

    document.getElementById('btn-undo').addEventListener('click', function() { self.undo(); });
    document.getElementById('btn-redo').addEventListener('click', function() { self.redo(); });

    document.getElementById('btn-export').addEventListener('click', function() {
      var layoutId = document.getElementById('layout-select').value || 'customLayout';
      var json = exportLayoutJSON(self.elements, layoutId);
      downloadFile(json, layoutId + '.json');
    });

    document.getElementById('btn-import').addEventListener('click', function() {
      document.getElementById('file-import').click();
    });

    document.getElementById('file-import').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var text = ev.target.result;
          if (text.indexOf('module.exports') === 0) {
            text = text.replace(/^module\.exports\s*=\s*/, '').replace(/;\s*$/, '');
          }
          var result = importLayoutJSON(text);
          self.pushUndo();
          self.elements = result.elements;
          self.selectedId = null;
          self.renderAll();
        } catch (err) {
          alert('Import failed: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (self.selectedId) { self.deleteElement(self.selectedId); e.preventDefault(); }
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { self.undo(); e.preventDefault(); }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { self.redo(); e.preventDefault(); }
      if (e.key === 'ArrowUp' && self.selectedId) { self._nudge(0, -1, e.shiftKey); e.preventDefault(); }
      if (e.key === 'ArrowDown' && self.selectedId) { self._nudge(0, 1, e.shiftKey); e.preventDefault(); }
      if (e.key === 'ArrowLeft' && self.selectedId) { self._nudge(-1, 0, e.shiftKey); e.preventDefault(); }
      if (e.key === 'ArrowRight' && self.selectedId) { self._nudge(1, 0, e.shiftKey); e.preventDefault(); }
    });
  };

  Editor.prototype._nudge = function(dx, dy, large) {
    var el = this.getSelectedElement();
    if (!el) return;
    this.pushUndo();
    var step = large ? 10 : 1;
    el.offset = el.offset || { x: 0, y: 0 };
    el.offset.x += dx * step;
    el.offset.y += dy * step;
    this.renderAll();
  };

  Editor.prototype._getCanvasPos = function(e) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.zoom,
      y: (e.clientY - rect.top) / this.zoom
    };
  };

  // 构建一个 id -> absoluteBounds 的缓存，每次renderAll时重建
  Editor.prototype._buildBoundsCache = function() {
    this._boundsCache = {};
    this._parentMap = {};
    var W = this.device.w;
    var H = this.device.h;
    for (var i = 0; i < this.elements.length; i++) {
      this._cacheBoundsRecursive(this.elements[i], 0, 0, W, H, null);
    }
  };

  Editor.prototype._cacheBoundsRecursive = function(el, parentAbsX, parentAbsY, containerW, containerH, parentId, presetBounds) {
    var bounds = presetBounds || this._calculateAbsoluteBounds(el, parentAbsX, parentAbsY, containerW, containerH);
    var absX = bounds.x;
    var absY = bounds.y;
    var sw = bounds.w;
    var sh = bounds.h;

    this._boundsCache[el.id] = { x: absX, y: absY, w: sw, h: sh };
    if (parentId) {
      this._parentMap[el.id] = parentId;
    }

    if (!el.children || el.children.length === 0) {
      return;
    }

    if (el.type === 'flex') {
      this._cacheFlexChildren(el, absX, absY, sw, sh);
      return;
    }

    for (var i = 0; i < el.children.length; i++) {
      this._cacheBoundsRecursive(el.children[i], absX, absY, sw, sh, el.id);
    }
  };

  Editor.prototype._calculateAbsoluteBounds = function(el, parentAbsX, parentAbsY, containerW, containerH) {
    var sw = parseSize(el.size ? el.size.width : 100, containerW);
    var sh = parseSize(el.size ? el.size.height : 100, containerH);
    var anchor = el.anchor || { x: 'left', y: 'top' };
    var bx = 0, by = 0;
    if (anchor.x === 'center') bx = (containerW - sw) / 2;
    else if (anchor.x === 'right') bx = containerW - sw;
    if (anchor.y === 'center') by = (containerH - sh) / 2;
    else if (anchor.y === 'bottom') by = containerH - sh;
    var ox = (el.offset ? el.offset.x : 0) || 0;
    var oy = (el.offset ? el.offset.y : 0) || 0;

    return {
      x: parentAbsX + bx + ox,
      y: parentAbsY + by + oy,
      w: sw,
      h: sh
    };
  };

  Editor.prototype._cacheFlexChildren = function(el, parentAbsX, parentAbsY, containerW, containerH) {
    var children = el.children || [];
    var flex = el.flex || {};
    var direction = flex.direction || 'row';
    var gap = flex.gap || 0;
    var justify = flex.justify || 'start';
    var align = flex.align || 'center';
    var isRow = direction === 'row';
    var mainAxis = isRow ? 'w' : 'h';
    var crossAxis = isRow ? 'h' : 'w';
    var containerMain = isRow ? containerW : containerH;
    var containerCross = isRow ? containerH : containerW;
    var totalMainSize = 0;
    var i;

    var resolvedChildren = children.map(function(child) {
      var size = {
        w: parseSize(child.size ? child.size.width : 100, containerW),
        h: parseSize(child.size ? child.size.height : 100, containerH)
      };
      totalMainSize += size[mainAxis];
      return {
        element: child,
        size: size
      };
    });

    var totalGap = gap * Math.max(0, children.length - 1);
    var freeSpace = containerMain - totalMainSize - totalGap;
    var startPos = 0;
    var itemGap = gap;

    if (justify === 'center') {
      startPos = freeSpace / 2;
    } else if (justify === 'end') {
      startPos = freeSpace;
    } else if (justify === 'space-between') {
      itemGap = children.length > 1 ? gap + freeSpace / (children.length - 1) : gap;
    } else if (justify === 'space-around' && children.length > 0) {
      var spaceAround = freeSpace / children.length;
      startPos = spaceAround / 2;
      itemGap = gap + spaceAround;
    }

    var currentPos = startPos;
    for (i = 0; i < resolvedChildren.length; i++) {
      var resolved = resolvedChildren[i];
      var child = resolved.element;
      var size = {
        w: resolved.size.w,
        h: resolved.size.h
      };
      var crossPos = 0;

      if (align === 'center') {
        crossPos = (containerCross - size[crossAxis]) / 2;
      } else if (align === 'end') {
        crossPos = containerCross - size[crossAxis];
      } else if (align === 'stretch') {
        size[crossAxis] = containerCross;
      }

      var ox = (child.offset ? child.offset.x : 0) || 0;
      var oy = (child.offset ? child.offset.y : 0) || 0;
      var bounds = isRow
        ? {
            x: parentAbsX + currentPos + ox,
            y: parentAbsY + crossPos + oy,
            w: size.w,
            h: size.h
          }
        : {
            x: parentAbsX + crossPos + ox,
            y: parentAbsY + currentPos + oy,
            w: size.w,
            h: size.h
          };

      currentPos += size[mainAxis] + itemGap;
      this._cacheBoundsRecursive(child, parentAbsX, parentAbsY, containerW, containerH, el.id, bounds);
    }
  };

  Editor.prototype._resolveElementBounds = function(el) {
    if (this._boundsCache && this._boundsCache[el.id]) {
      return this._boundsCache[el.id];
    }
    // fallback: 顶层元素
    var W = this.device.w;
    var H = this.device.h;
    var sw = parseSize(el.size ? el.size.width : 100, W);
    var sh = parseSize(el.size ? el.size.height : 100, H);
    var anchor = el.anchor || { x: 'left', y: 'top' };
    var bx = 0, by = 0;
    if (anchor.x === 'center') bx = (W - sw) / 2;
    else if (anchor.x === 'right') bx = W - sw;
    if (anchor.y === 'center') by = (H - sh) / 2;
    else if (anchor.y === 'bottom') by = H - sh;
    var ox = (el.offset ? el.offset.x : 0) || 0;
    var oy = (el.offset ? el.offset.y : 0) || 0;
    return { x: bx + ox, y: by + oy, w: sw, h: sh };
  };

  function parseSize(val, base) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && val.endsWith('%')) return (parseFloat(val) / 100) * base;
    return parseFloat(val) || 0;
  }

  // hitTest: 递归检查所有元素，children优先（最上层的先命中）
  Editor.prototype._hitTest = function(px, py) {
    this._ensureBoundsCache();
    var result = null;
    function check(elements) {
      for (var i = elements.length - 1; i >= 0; i--) {
        var el = elements[i];
        // 先检查children（子元素在上层）
        if (el.children && el.children.length > 0) {
          var childHit = null;
          check.call(null, el.children);
          // 用闭包外的result
        }
      }
    }
    // 用扁平化方式：从boundsCache里找最小的命中元素
    this._hitTestResult = null;
    this._hitTestRecursive(this.elements, px, py);
    return this._hitTestResult;
  };

  Editor.prototype._hitTestRecursive = function(elements, px, py) {
    for (var i = elements.length - 1; i >= 0; i--) {
      var el = elements[i];
      // 先递归children（子元素优先命中）
      if (el.children && el.children.length > 0) {
        this._hitTestRecursive(el.children, px, py);
        if (this._hitTestResult) return;
      }
      var b = this._resolveElementBounds(el);
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        this._hitTestResult = el;
        return;
      }
    }
  };

  Editor.prototype._getResizeHandle = function(px, py) {
    this._ensureBoundsCache();
    var el = this.getSelectedElement();
    if (!el) return null;
    var b = this._resolveElementBounds(el);
    var hs = 8;
    if (px >= b.x + b.w - hs && px <= b.x + b.w + hs &&
        py >= b.y + b.h - hs && py <= b.y + b.h + hs) {
      return 'se';
    }
    return null;
  };

  Editor.prototype._onMouseDown = function(e) {
    var pos = this._getCanvasPos(e);
    var handle = this._getResizeHandle(pos.x, pos.y);
    if (handle) {
      this.isResizing = true;
      this.resizeHandle = handle;
      this.pushUndo();
      return;
    }
    var hit = this._hitTest(pos.x, pos.y);
    if (hit) {
      this.selectElement(hit.id);
      this.isDragging = true;
      var b = this._resolveElementBounds(hit);
      this.dragOffset = { x: pos.x - b.x, y: pos.y - b.y };
      this._dragStartBounds = { x: b.x, y: b.y };
      this.pushUndo();
    } else {
      this.selectElement(null);
    }
  };

  Editor.prototype._onMouseMove = function(e) {
    var pos = this._getCanvasPos(e);
    if (this.isDragging && this.selectedId) {
      var el = this.getSelectedElement();
      if (!el) return;
      var b = this._resolveElementBounds(el);
      var newX = pos.x - this.dragOffset.x;
      var newY = pos.y - this.dragOffset.y;
      var dx = newX - b.x;
      var dy = newY - b.y;
      el.offset = el.offset || { x: 0, y: 0 };
      el.offset.x += dx;
      el.offset.y += dy;
      // 重建缓存后再渲染
      this._buildBoundsCache();
      this.renderCanvas();
      this.propPanel.render();
    } else if (this.isResizing && this.selectedId) {
      var el = this.getSelectedElement();
      if (!el) return;
      var b = this._resolveElementBounds(el);
      el.size = el.size || { width: 100, height: 100 };
      el.size.width = Math.max(20, Math.round(pos.x - b.x));
      el.size.height = Math.max(20, Math.round(pos.y - b.y));
      this._buildBoundsCache();
      this.renderCanvas();
      this.propPanel.render();
    } else {
      var handle = this._getResizeHandle(pos.x, pos.y);
      this.canvas.style.cursor = handle ? 'se-resize' : 'default';
    }
  };

  Editor.prototype._onMouseUp = function() {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this._dragStartBounds = null;
  };

  Editor.prototype.selectElement = function(id) {
    this.selectedId = id;
    this.renderAll();
  };

  Editor.prototype.getSelectedElement = function() {
    return findById(this.elements, this.selectedId);
  };

  Editor.prototype.addElement = function(type) {
    this.pushUndo();
    var defaults = ELEMENT_DEFAULTS[type] || {};
    var el = {
      id: type + '_' + Math.random().toString(36).slice(2, 6),
      type: type,
      anchor: { x: 'center', y: 'center' },
      offset: { x: 0, y: 0 },
      size: defaults.size ? JSON.parse(JSON.stringify(defaults.size)) : { width: 100, height: 100 },
      style: defaults.style ? JSON.parse(JSON.stringify(defaults.style)) : {}
    };
    if (defaults.flex) el.flex = JSON.parse(JSON.stringify(defaults.flex));
    if (type === 'flex') el.children = [];
    this.elements.push(el);
    this.selectedId = el.id;
    this.renderAll();
  };

  Editor.prototype.deleteElement = function(id) {
    this.pushUndo();
    this.elements = removeById(this.elements, id);
    if (this.selectedId === id) this.selectedId = null;
    this.renderAll();
  };

  Editor.prototype.reorderElement = function(draggedId, targetId) {
    this.pushUndo();
    var dragged = findById(this.elements, draggedId);
    if (!dragged) return;
    this.elements = removeById(this.elements, draggedId);
    var idx = this.elements.findIndex(function(e) { return e.id === targetId; });
    if (idx >= 0) {
      this.elements.splice(idx + 1, 0, dragged);
    } else {
      this.elements.push(dragged);
    }
    this.renderAll();
  };

  Editor.prototype.updateProperty = function(path, value) {
    var el = this.getSelectedElement();
    if (!el) return;
    this.pushUndo();
    setNestedValue(el, path, parseValue(value));
    this.renderAll();
  };

  Editor.prototype.pushUndo = function() {
    this.undoStack.push(JSON.stringify(this.elements));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  };

  Editor.prototype.undo = function() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(JSON.stringify(this.elements));
    this.elements = JSON.parse(this.undoStack.pop());
    if (this.selectedId && !findById(this.elements, this.selectedId)) {
      this.selectedId = null;
    }
    this.renderAll();
  };

  Editor.prototype.redo = function() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(JSON.stringify(this.elements));
    this.elements = JSON.parse(this.redoStack.pop());
    this.renderAll();
  };

  Editor.prototype.renderAll = function() {
    this._buildBoundsCache();
    this.renderCanvas();
    this.treePanel.render();
    this.propPanel.render();
  };

  Editor.prototype.renderCanvas = function() {
    this._ensureBoundsCache();
    var ctx = this.ctx;
    var W = this.device.w;
    var H = this.device.h;
    var theme = getTheme(this.themeId);

    var dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 手机背景
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = createGrad(ctx, 0, 0, 0, H, theme.overlayStops);
    ctx.fillRect(0, 0, W, H);

    drawGrid(ctx, W, H);

    // 手机边框
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    roundedRectPath(ctx, 1, 1, W - 2, H - 2, 20);
    ctx.stroke();
    // 状态栏
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, W, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = editorFont(10, '500');
    ctx.textAlign = 'center';
    ctx.fillText('9:41', W / 2, 15);
    ctx.textAlign = 'right';
    ctx.fillText('100%', W - 12, 15);
    ctx.textAlign = 'left';
    ctx.fillText('Signal', 12, 15);
    ctx.restore();

    // 渲染所有元素
    for (var i = 0; i < this.elements.length; i++) {
      this._renderElement(ctx, this.elements[i], theme, W, H, false);
    }

    // 选中元素高亮 + 标注
    if (this.selectedId) {
      var sel = this.getSelectedElement();
      if (sel) {
        var b = this._resolveElementBounds(sel);
        ctx.save();
        // 选中框
        ctx.strokeStyle = '#7cc9b8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        ctx.setLineDash([]);
        // 缩放手柄
        ctx.fillStyle = '#7cc9b8';
        ctx.fillRect(b.x + b.w - 4, b.y + b.h - 4, 8, 8);
        // 尺寸标注
        ctx.fillStyle = '#7cc9b8';
        ctx.font = editorFont(9, '600');
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(b.w) + ' x ' + Math.round(b.h), b.x + b.w / 2, b.y - 6);
        // 坐标标注
        ctx.textAlign = 'left';
        ctx.fillText('(' + Math.round(b.x) + ', ' + Math.round(b.y) + ')', b.x, b.y - 18);
        ctx.restore();
      }
    }
  };

  Editor.prototype._renderElement = function(ctx, el, theme, W, H, isChild) {
    var b = this._resolveElementBounds(el);
    var s = el.style || {};

    ctx.save();
    switch (el.type) {
      case 'glassPanel':
        editorDrawGlassPanel(ctx, b.x, b.y, b.w, b.h, {
          radius: s.radius || 22,
          glow: resolveThemeColor(s.glow, theme) || theme.panelGlow,
          shadowBlur: s.shadowBlur || 12,
          stroke: resolveThemeColor(s.stroke, theme) || theme.panelStroke,
          innerStroke: resolveThemeColor(s.innerStroke, theme) || theme.panelInnerStroke,
          stops: resolveThemeStops(s.stops, theme) || theme.panelStrongStops
        });
        break;

      case 'text':
        ctx.fillStyle = resolveThemeColor(s.color, theme) || theme.cardLabel;
        ctx.font = editorFont(s.fontSize || 14, s.fontWeight || '400');
        ctx.textAlign = s.textAlign || 'left';
        var text = s.text || el.textKey || 'Text';
        var ty = b.y + (s.fontSize || 14);
        if (s.textAlign === 'center') {
          ctx.fillText(text, b.x + b.w / 2, ty);
        } else if (s.textAlign === 'right') {
          ctx.fillText(text, b.x + b.w, ty);
        } else {
          ctx.fillText(text, b.x, ty);
        }
        break;

      case 'actionButton':
        editorDrawActionButton(ctx, b.x, b.y, b.w, b.h, s.text || el.textKey || 'Button', {
          radius: s.radius,
          font: editorFont(s.fontSize || 18, '700'),
          textColor: resolveThemeColor(s.textColor, theme) || theme.buttonText,
          shadowColor: resolveThemeColor(s.shadowColor, theme) || theme.buttonShadow,
          stops: resolveThemeStops(s.stops, theme) || theme.buttonPrimaryStops
        });
        break;

      case 'closeButton':
        editorDrawCloseButton(ctx, b.x, b.y, b.w || 26, {
          glow: resolveThemeColor(s.glow, theme) || theme.panelGlow,
          stroke: resolveThemeColor(s.stroke, theme) || theme.panelStroke
        });
        break;

      case 'badge':
        editorDrawBadge(ctx, b.x, b.y, s.text || el.textKey || 'Badge', {
          color: resolveThemeColor(s.color, theme) || theme.badgeText,
          dotColor: resolveThemeColor(s.dotColor, theme),
          glow: resolveThemeColor(s.glow, theme) || theme.panelGlow,
          stops: resolveThemeStops(s.stops, theme) || theme.badgeStops,
          stroke: resolveThemeColor(s.stroke, theme) || theme.panelStroke
        });
        break;

      case 'iconTile':
        editorDrawIconTile(ctx, b.x, b.y, b.w, b.h,
          s.iconText || (el.imageKey ? '🖼' : '📦'), s.label || el.textKey || 'Icon', {
            active: !!s.active,
            labelSize: s.labelSize || 11,
            activeAccent: resolveThemeColor(s.activeAccent, theme) || theme.accentSoft,
            iconColor: resolveThemeColor(s.iconColor, theme) || theme.chipLabel,
            activeGlow: resolveThemeColor(s.activeGlow, theme) || theme.panelGlow
          });
        break;

      case 'metricCard':
        editorDrawMetricCard(ctx, b.x, b.y, b.w, b.h,
          s.label || el.textKey || 'Label', s.value || '0', {
            radius: s.radius,
            labelColor: resolveThemeColor(s.labelColor, theme),
            valueColor: resolveThemeColor(s.valueColor, theme)
          });
        break;

      case 'roundRect':
        ctx.fillStyle = resolveThemeColor(s.fill, theme) || theme.cardFill;
        roundedRectPath(ctx, b.x, b.y, b.w, b.h, s.radius || 14);
        ctx.fill();
        // 占位内容：显示id和尺寸
        drawPlaceholderContent(ctx, b, el, theme);
        break;

      case 'rect':
        ctx.fillStyle = resolveThemeColor(s.fill, theme) || 'rgba(0,0,0,0.5)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        drawPlaceholderContent(ctx, b, el, theme);
        break;

      case 'flex':
        // 虚线边框 + 背景色
        ctx.fillStyle = 'rgba(124,201,184,0.04)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = 'rgba(124,201,184,0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.setLineDash([]);
        // flex标签
        ctx.fillStyle = 'rgba(124,201,184,0.85)';
        ctx.font = editorFont(9, '700');
        ctx.textAlign = 'left';
        var flexDir = (el.flex && el.flex.direction) || 'row';
        var flexGap = (el.flex && el.flex.gap) || 0;
        ctx.fillText('FLEX ' + flexDir + ' gap=' + flexGap, b.x + 4, b.y + 10);
        // 如果没有children，画占位子元素
        if (!el.children || el.children.length === 0) {
          drawFlexPlaceholder(ctx, b, flexDir);
        }
        break;

      case 'image':
        drawImagePlaceholder(ctx, b, el, theme);
        break;

      case 'scrollList':
        drawScrollListPlaceholder(ctx, b, el, theme);
        break;

      default:
        // 未知类型也要可见
        ctx.fillStyle = 'rgba(255,100,100,0.1)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = 'rgba(255,100,100,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        drawPlaceholderContent(ctx, b, el, theme);
        break;
    }
    ctx.restore();

    // 每个元素都画ID标签（选中时不画，因为选中框已经有标注）
    if (el.id !== this.selectedId) {
      drawElementLabel(ctx, b, el);
    }

    // 渲染子元素
    if (el.children) {
      for (var j = 0; j < el.children.length; j++) {
        this._renderElement(ctx, el.children[j], theme, W, H, true);
      }
    }
  };

  Editor.prototype._ensureBoundsCache = function() {
    if (!this._boundsCache) {
      this._buildBoundsCache();
    }
  };

  // 在rect/roundRect等无内容元素上画占位信息
  function drawPlaceholderContent(ctx, b, el, theme) {
    if (b.w < 30 || b.h < 16) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = editorFont(Math.min(11, b.h * 0.4), '600');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var label = el.style && el.style.text ? el.style.text : el.id;
    ctx.fillText(truncate(label, b.w, ctx), b.x + b.w / 2, b.y + b.h / 2);
    ctx.restore();
  }

  // 图片占位
  function drawImagePlaceholder(ctx, b, el, theme) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundedRectPath(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    roundedRectPath(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    // 图片图标
    var iconSize = Math.min(32, b.w * 0.4, b.h * 0.4);
    var cx = b.x + b.w / 2;
    var cy = b.y + b.h / 2 - 6;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = editorFont(iconSize, '400');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🖼', cx, cy);
    // 文件名
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = editorFont(9, '500');
    ctx.fillText(el.imageKey || el.id, cx, cy + iconSize / 2 + 10);
    ctx.restore();
  }

  // 滚动列表占位
  function drawScrollListPlaceholder(ctx, b, el, theme) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundedRectPath(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    roundedRectPath(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.stroke();
    // 画3-4行占位行
    var rowH = 44;
    var gap = 6;
    var rows = Math.min(5, Math.floor((b.h - 16) / (rowH + gap)));
    var startY = b.y + 8;
    for (var i = 0; i < rows; i++) {
      var ry = startY + i * (rowH + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundedRectPath(ctx, b.x + 8, ry, b.w - 16, rowH, 10);
      ctx.fill();
      // 行内占位文字
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = editorFont(11, '500');
      ctx.textAlign = 'left';
      ctx.fillText('Item ' + (i + 1), b.x + 20, ry + 18);
      // 占位描述
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = editorFont(9, '400');
      ctx.fillText('Description placeholder...', b.x + 20, ry + 32);
    }
    // 滚动条
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundedRectPath(ctx, b.x + b.w - 6, b.y + 8, 3, b.h * 0.3, 2);
    ctx.fill();
    // 标签
    ctx.fillStyle = 'rgba(124,201,184,0.6)';
    ctx.font = editorFont(8, '700');
    ctx.textAlign = 'right';
    ctx.fillText('SCROLL LIST', b.x + b.w - 12, b.y + b.h - 6);
    ctx.restore();
  }

  // flex占位子元素
  function drawFlexPlaceholder(ctx, b, direction) {
    ctx.save();
    var count = 3;
    var gap = 6;
    if (direction === 'row') {
      var itemW = (b.w - gap * (count + 1)) / count;
      var itemH = b.h - 20;
      for (var i = 0; i < count; i++) {
        var ix = b.x + gap + i * (itemW + gap);
        var iy = b.y + 16;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        roundedRectPath(ctx, ix, iy, itemW, itemH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        roundedRectPath(ctx, ix, iy, itemW, itemH, 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      var itemH2 = (b.h - 16 - gap * (count + 1)) / count;
      var itemW2 = b.w - 16;
      for (var j = 0; j < count; j++) {
        var jx = b.x + 8;
        var jy = b.y + 16 + j * (itemH2 + gap);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        roundedRectPath(ctx, jx, jy, itemW2, itemH2, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        roundedRectPath(ctx, jx, jy, itemW2, itemH2, 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  // 元素ID标签（半透明小标签）
  function drawElementLabel(ctx, b, el) {
    if (b.w < 20 || b.h < 12) return;
    ctx.save();
    var label = el.id;
    ctx.font = editorFont(8, '600');
    var tw = ctx.measureText(label).width + 6;
    var lx = b.x + 2;
    var ly = b.y + 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundedRectPath(ctx, lx, ly, tw, 12, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, lx + 3, ly + 2);
    ctx.restore();
  }

  function truncate(str, maxW, ctx) {
    if (!str) return '';
    if (ctx.measureText(str).width <= maxW - 8) return str;
    for (var i = str.length - 1; i > 0; i--) {
      var t = str.slice(0, i) + '..';
      if (ctx.measureText(t).width <= maxW - 8) return t;
    }
    return '..';
  }

  function drawGrid(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    var step = 20;
    for (var x = 0; x <= W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y <= H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    var cx = W / 2;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.restore();
  }

  function findById(elements, id) {
    if (!id) return null;
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].id === id) return elements[i];
      if (elements[i].children) {
        var found = findById(elements[i].children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function removeById(elements, id) {
    return elements.filter(function(el) {
      if (el.id === id) return false;
      if (el.children) el.children = removeById(el.children, id);
      return true;
    });
  }

  function setNestedValue(obj, path, value) {
    var parts = path.split('.');
    var target = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]] || typeof target[parts[i]] !== 'object') {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
  }

  function parseValue(val) {
    if (val === '') return '';
    if (val === 'true') return true;
    if (val === 'false') return false;
    var num = Number(val);
    if (!isNaN(num) && val.trim() !== '') return num;
    return val;
  }

  window.addEventListener('DOMContentLoaded', function() {
    window._editor = new Editor();
  });
})();
