var TYPE_ICONS = {
  glassPanel: '🪟', text: '📝', actionButton: '🔘', closeButton: '✖',
  badge: '🏷', iconTile: '🧩', metricCard: '📊', roundRect: '⬜',
  rect: '▪', flex: '📐', image: '🖼', scrollList: '📜'
};

function TreePanel(editor) {
  this.editor = editor;
  this.listEl = document.getElementById('element-tree');
}

TreePanel.prototype.render = function() {
  var self = this;
  var elements = this.editor.elements;
  var selectedId = this.editor.selectedId;
  this.listEl.innerHTML = '';

  function addItem(el, depth) {
    var li = document.createElement('li');
    li.className = (depth > 0 ? 'depth-' + Math.min(depth, 2) : '') +
      (el.id === selectedId ? ' selected' : '');
    li.dataset.id = el.id;

    var arrow = '';
    if (el.children && el.children.length > 0) {
      arrow = '<span style="font-size:9px;margin-right:2px">▼</span>';
    }

    var typeIcon = TYPE_ICONS[el.type] || '❓';
    var displayText = el.style && el.style.text ? el.style.text : (el.textKey || el.id);

    li.innerHTML = arrow +
      '<span style="font-size:11px">' + typeIcon + '</span>' +
      '<span class="type-tag">' + (el.type || '?') + '</span> ' +
      '<span style="opacity:0.9">' + escapeHtml(displayText) + '</span>';

    li.addEventListener('click', function(e) {
      e.stopPropagation();
      self.editor.selectElement(el.id);
    });

    li.draggable = true;
    li.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', el.id);
    });
    li.addEventListener('dragover', function(e) {
      e.preventDefault();
      li.style.borderBottom = '2px solid var(--accent)';
    });
    li.addEventListener('dragleave', function() {
      li.style.borderBottom = '';
    });
    li.addEventListener('drop', function(e) {
      e.preventDefault();
      li.style.borderBottom = '';
      var draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== el.id) {
        self.editor.reorderElement(draggedId, el.id);
      }
    });

    self.listEl.appendChild(li);

    if (el.children) {
      for (var i = 0; i < el.children.length; i++) {
        addItem(el.children[i], depth + 1);
      }
    }
  }

  for (var i = 0; i < elements.length; i++) {
    addItem(elements[i], 0);
  }
};

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
