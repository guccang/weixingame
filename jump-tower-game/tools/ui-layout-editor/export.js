function exportLayoutJSON(elements, layoutId) {
  var config = {
    id: layoutId || 'untitled',
    vars: {},
    elements: elements.map(function(el) {
      return exportElement(el);
    })
  };
  return JSON.stringify(config, null, 2);
}

function exportElement(el) {
  var out = { id: el.id, type: el.type };

  if (el.anchor) out.anchor = { x: el.anchor.x, y: el.anchor.y };
  if (el.offset) out.offset = { x: el.offset.x, y: el.offset.y };
  if (el.size) out.size = { width: el.size.width, height: el.size.height };
  if (el.style && Object.keys(el.style).length > 0) {
    out.style = cleanObj(el.style);
  }
  if (el.textKey) out.textKey = el.textKey;
  if (el.imageKey) out.imageKey = el.imageKey;
  if (el.action && el.action.type) out.action = cleanObj(el.action);
  if (el.visibleWhen) out.visibleWhen = el.visibleWhen;

  if (el.type === 'flex' && el.flex) {
    out.flex = cleanObj(el.flex);
  }

  if (el.children && el.children.length > 0) {
    out.children = el.children.map(exportElement);
  }

  return out;
}

function exportAsJSModule(elements, layoutId) {
  var json = exportLayoutJSON(elements, layoutId);
  return 'module.exports = ' + json + ';\n';
}

function importLayoutJSON(jsonStr) {
  var config = JSON.parse(jsonStr);
  if (!config.elements || !Array.isArray(config.elements)) {
    throw new Error('Invalid layout: missing elements array');
  }
  return {
    id: config.id || 'imported',
    elements: config.elements.map(importElement)
  };
}

function importElement(raw) {
  var el = {
    id: raw.id || 'el_' + Math.random().toString(36).slice(2, 8),
    type: raw.type || 'rect',
    anchor: raw.anchor || { x: 'left', y: 'top' },
    offset: raw.offset || { x: 0, y: 0 },
    size: raw.size || { width: 100, height: 100 },
    style: raw.style || {},
    textKey: raw.textKey || '',
    imageKey: raw.imageKey || '',
    action: raw.action || null,
    visibleWhen: raw.visibleWhen || null
  };

  if (raw.type === 'flex' && raw.flex) {
    el.flex = raw.flex;
  }

  if (raw.children && raw.children.length > 0) {
    el.children = raw.children.map(importElement);
  }

  return el;
}

function cleanObj(obj) {
  var out = {};
  for (var k in obj) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      out[k] = obj[k];
    }
  }
  return out;
}

function downloadFile(content, filename) {
  var blob = new Blob([content], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
