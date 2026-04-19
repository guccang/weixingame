function PropertyPanel(editor) {
  this.editor = editor;
  this.container = document.getElementById('prop-content');
}

PropertyPanel.prototype.render = function() {
  var el = this.editor.getSelectedElement();
  if (!el) {
    this.container.innerHTML = '<div class="empty-hint">Select an element to edit</div>';
    return;
  }

  var self = this;
  var html = '';

  html += section('Basic', [
    field('id', 'text', el.id),
    fieldSelect('type', ['glassPanel','text','actionButton','closeButton','badge','iconTile','metricCard','roundRect','rect','image','scrollList','flex'], el.type)
  ]);

  html += section('Anchor', [
    fieldSelect('anchor.x', ['left','center','right'], (el.anchor && el.anchor.x) || 'left'),
    fieldSelect('anchor.y', ['top','center','bottom'], (el.anchor && el.anchor.y) || 'top')
  ]);

  html += section('Offset', [
    fieldNum('offset.x', (el.offset && el.offset.x) || 0),
    fieldNum('offset.y', (el.offset && el.offset.y) || 0)
  ]);

  html += section('Size', [
    fieldText('size.width', el.size ? el.size.width : 100),
    fieldText('size.height', el.size ? el.size.height : 100)
  ]);

  var s = el.style || {};
  var styleFields = [];

  if (el.type === 'glassPanel' || el.type === 'roundRect') {
    styleFields.push(fieldNum('style.radius', s.radius || 22));
  }
  if (el.type === 'text') {
    styleFields.push(fieldNum('style.fontSize', s.fontSize || 14));
    styleFields.push(fieldSelect('style.fontWeight', ['400','500','600','700'], s.fontWeight || '400'));
    styleFields.push(fieldSelect('style.textAlign', ['left','center','right'], s.textAlign || 'left'));
  }
  if (el.type === 'actionButton') {
    styleFields.push(fieldNum('style.fontSize', s.fontSize || 18));
    styleFields.push(fieldNum('style.radius', s.radius || 0));
  }

  styleFields.push(fieldThemeColor('style.color', s.color));
  styleFields.push(fieldThemeColor('style.fill', s.fill));
  styleFields.push(fieldThemeColor('style.glow', s.glow));
  styleFields.push(fieldThemeColor('style.stroke', s.stroke));
  styleFields.push(fieldText('style.text', s.text || ''));

  html += section('Style', styleFields);

  html += section('Content', [
    fieldText('textKey', el.textKey || ''),
    fieldText('imageKey', el.imageKey || '')
  ]);

  html += section('Action', [
    fieldText('action.type', el.action ? el.action.type : ''),
    fieldText('action.panel', el.action ? el.action.panel : '')
  ]);

  if (el.type === 'flex') {
    var flex = el.flex || {};
    html += section('Flex', [
      fieldSelect('flex.direction', ['row','column'], flex.direction || 'row'),
      fieldNum('flex.gap', flex.gap || 0),
      fieldSelect('flex.justify', ['start','center','end','space-between','space-around'], flex.justify || 'start'),
      fieldSelect('flex.align', ['start','center','end','stretch'], flex.align || 'center')
    ]);
  }

  html += '<div class="section"><button id="btn-delete-el" style="background:#f85149;color:#fff;border:none;border-radius:6px;padding:5px 14px;font-size:12px;cursor:pointer;width:100%">Delete Element</button></div>';

  this.container.innerHTML = html;

  this.container.querySelectorAll('input, select').forEach(function(input) {
    input.addEventListener('change', function() {
      self.editor.updateProperty(input.dataset.path, input.value);
    });
  });

  var delBtn = document.getElementById('btn-delete-el');
  if (delBtn) {
    delBtn.addEventListener('click', function() {
      self.editor.deleteElement(el.id);
    });
  }
};

function section(title, fields) {
  return '<div class="section"><div class="section-title">' + title + '</div>' +
    fields.join('') + '</div>';
}

function field(path, type, value) {
  return '<div class="field"><label>' + shortLabel(path) + '</label>' +
    '<input type="' + type + '" data-path="' + path + '" value="' + escapeAttr(value) + '"></div>';
}

function fieldNum(path, value) {
  return '<div class="field"><label>' + shortLabel(path) + '</label>' +
    '<input type="number" data-path="' + path + '" value="' + (value || 0) + '"></div>';
}

function fieldText(path, value) {
  return '<div class="field"><label>' + shortLabel(path) + '</label>' +
    '<input type="text" data-path="' + path + '" value="' + escapeAttr(value) + '"></div>';
}

function fieldSelect(path, options, current) {
  var opts = options.map(function(o) {
    return '<option value="' + o + '"' + (o === current ? ' selected' : '') + '>' + o + '</option>';
  }).join('');
  return '<div class="field"><label>' + shortLabel(path) + '</label>' +
    '<select data-path="' + path + '">' + opts + '</select></div>';
}

function fieldThemeColor(path, value) {
  var tokens = getThemeTokenList();
  var isToken = typeof value === 'string' && value.charAt(0) === '$';
  var displayVal = value || '';
  var previewColor = '';

  if (isToken) {
    var theme = getTheme(window._editorThemeId || 'mist');
    previewColor = theme[value.slice(1)] || '';
  } else if (value && typeof value === 'string') {
    previewColor = value;
  }

  var colorBox = previewColor ? '<div class="color-preview" style="background:' + previewColor + '"></div>' : '';

  return '<div class="field"><label>' + shortLabel(path) + '</label>' +
    '<input type="text" data-path="' + path + '" value="' + escapeAttr(displayVal) + '" placeholder="$token or #hex">' +
    colorBox + '</div>';
}

function shortLabel(path) {
  var parts = path.split('.');
  return parts[parts.length - 1];
}

function escapeAttr(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
