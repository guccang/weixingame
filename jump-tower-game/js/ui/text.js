const tableManager = require('../tables/tableManager');

function getText(key) {
  const texts = tableManager.getAll('UIText');
  const item = texts.find(function(entry) {
    return entry.Key === key;
  });

  if (!item) return key;

  let text = item.Text;
  for (let i = 1; i < arguments.length; i++) {
    text = text.replace('{' + (i - 1) + '}', arguments[i]);
  }
  return text;
}

module.exports = {
  getText
};
