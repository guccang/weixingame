var THEMES = {
  mist: {
    id: 'mist', name: '雾青',
    titleColor: '#f4fbff', subtitleColor: '#b8cbda',
    accent: '#7cc9b8', accentSoft: '#c7efe3', heroAccent: '#8dd9c8',
    panelGlow: 'rgba(124, 201, 184, 0.10)',
    panelStroke: 'rgba(220, 236, 233, 0.22)',
    panelInnerStroke: 'rgba(255, 255, 255, 0.05)',
    panelStops: [[0, 'rgba(20, 29, 36, 0.76)'], [1, 'rgba(11, 17, 22, 0.64)']],
    panelMutedStops: [[0, 'rgba(22, 30, 38, 0.62)'], [1, 'rgba(12, 17, 21, 0.54)']],
    panelStrongStops: [[0, 'rgba(24, 34, 42, 0.90)'], [1, 'rgba(12, 18, 24, 0.84)']],
    navPanelStops: [[0, 'rgba(17, 24, 30, 0.58)'], [1, 'rgba(10, 15, 19, 0.48)']],
    buttonPrimaryStops: [[0, '#d7efe6'], [0.52, '#b7e0d4'], [1, '#9ecdbf']],
    buttonText: '#172126', buttonShadow: 'rgba(157, 205, 191, 0.18)',
    buttonDanger: '#c78484',
    chipFill: 'rgba(255, 255, 255, 0.08)', chipStroke: 'rgba(255, 255, 255, 0.12)',
    chipLabel: 'rgba(226, 235, 240, 0.72)',
    cardFill: 'rgba(255, 255, 255, 0.06)', cardLabel: '#f4fbff',
    cardSubtle: '#b4c3cb', cardMeta: '#d9e1c0',
    hudPanel: 'rgba(10, 14, 18, 0.36)', hudStroke: 'rgba(226, 235, 240, 0.14)',
    hudText: '#f5fbff', hudSubtle: 'rgba(230, 238, 242, 0.76)', hudAccent: '#dcefe8',
    badgeStops: [[0, 'rgba(22, 32, 38, 0.66)'], [1, 'rgba(14, 20, 24, 0.58)']],
    badgeText: '#eff8ff',
    overlayStops: [[0, 'rgba(2, 8, 16, 0.08)'], [0.35, 'rgba(5, 14, 24, 0.18)'], [1, 'rgba(2, 5, 10, 0.30)']]
  },
  dawn: {
    id: 'dawn', name: '晨砂',
    titleColor: '#fff9f1', subtitleColor: '#e2cdb9',
    accent: '#d6a37b', accentSoft: '#f5dcc8', heroAccent: '#e0b48f',
    panelGlow: 'rgba(214, 163, 123, 0.10)',
    panelStroke: 'rgba(244, 225, 207, 0.20)',
    panelInnerStroke: 'rgba(255, 245, 236, 0.04)',
    panelStops: [[0, 'rgba(40, 27, 20, 0.74)'], [1, 'rgba(23, 16, 12, 0.62)']],
    panelMutedStops: [[0, 'rgba(42, 30, 22, 0.60)'], [1, 'rgba(23, 16, 12, 0.52)']],
    panelStrongStops: [[0, 'rgba(44, 31, 23, 0.90)'], [1, 'rgba(26, 18, 14, 0.84)']],
    navPanelStops: [[0, 'rgba(35, 24, 18, 0.56)'], [1, 'rgba(24, 17, 12, 0.46)']],
    buttonPrimaryStops: [[0, '#f8e4cf'], [0.52, '#ecc7a7'], [1, '#dfad83']],
    buttonText: '#2a1d16', buttonShadow: 'rgba(223, 173, 131, 0.18)',
    buttonDanger: '#c48a8a',
    chipFill: 'rgba(255, 250, 245, 0.08)', chipStroke: 'rgba(255, 244, 236, 0.12)',
    chipLabel: 'rgba(250, 237, 225, 0.74)',
    cardFill: 'rgba(255, 247, 240, 0.06)', cardLabel: '#fff8f1',
    cardSubtle: '#dcc8b8', cardMeta: '#f1d3a8',
    hudPanel: 'rgba(22, 14, 10, 0.34)', hudStroke: 'rgba(255, 240, 227, 0.12)',
    hudText: '#fff9f1', hudSubtle: 'rgba(248, 232, 216, 0.74)', hudAccent: '#f2dbc7',
    badgeStops: [[0, 'rgba(41, 28, 21, 0.64)'], [1, 'rgba(25, 18, 14, 0.58)']],
    badgeText: '#fff7ef',
    overlayStops: [[0, 'rgba(20, 10, 4, 0.05)'], [0.35, 'rgba(34, 17, 10, 0.16)'], [1, 'rgba(16, 8, 5, 0.28)']]
  },
  moss: {
    id: 'moss', name: '苔岩',
    titleColor: '#f0f5ec', subtitleColor: '#c0c9bb',
    accent: '#91ab8c', accentSoft: '#d6e0d0', heroAccent: '#a8c09f',
    panelGlow: 'rgba(145, 171, 140, 0.10)',
    panelStroke: 'rgba(217, 227, 211, 0.18)',
    panelInnerStroke: 'rgba(255, 255, 255, 0.04)',
    panelStops: [[0, 'rgba(24, 30, 24, 0.76)'], [1, 'rgba(13, 17, 14, 0.62)']],
    panelMutedStops: [[0, 'rgba(26, 31, 25, 0.60)'], [1, 'rgba(14, 18, 15, 0.52)']],
    panelStrongStops: [[0, 'rgba(28, 34, 27, 0.90)'], [1, 'rgba(15, 19, 16, 0.84)']],
    navPanelStops: [[0, 'rgba(19, 24, 20, 0.56)'], [1, 'rgba(12, 16, 13, 0.46)']],
    buttonPrimaryStops: [[0, '#dde7d7'], [0.52, '#bfd0b6'], [1, '#9eb197']],
    buttonText: '#1a2219', buttonShadow: 'rgba(158, 177, 151, 0.18)',
    buttonDanger: '#b58a87',
    chipFill: 'rgba(255, 255, 255, 0.07)', chipStroke: 'rgba(255, 255, 255, 0.10)',
    chipLabel: 'rgba(225, 232, 223, 0.72)',
    cardFill: 'rgba(255, 255, 255, 0.05)', cardLabel: '#f0f5ec',
    cardSubtle: '#bcc7b9', cardMeta: '#d8d8b0',
    hudPanel: 'rgba(12, 15, 12, 0.34)', hudStroke: 'rgba(228, 236, 223, 0.12)',
    hudText: '#f4f8f0', hudSubtle: 'rgba(227, 234, 222, 0.72)', hudAccent: '#dbe7d6',
    badgeStops: [[0, 'rgba(24, 31, 24, 0.64)'], [1, 'rgba(16, 20, 16, 0.58)']],
    badgeText: '#f1f7ee',
    overlayStops: [[0, 'rgba(4, 9, 5, 0.05)'], [0.35, 'rgba(9, 16, 10, 0.16)'], [1, 'rgba(5, 9, 6, 0.28)']]
  }
};

var THEME_TOKEN_KEYS = Object.keys(THEMES.mist);

function getTheme(id) {
  return THEMES[id] || THEMES.mist;
}

function getThemeTokenList() {
  return THEME_TOKEN_KEYS.filter(function(k) {
    return k !== 'id' && k !== 'name';
  });
}

function renderThemeSwatches(containerId, currentThemeId, onChange) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  Object.keys(THEMES).forEach(function(id) {
    var t = THEMES[id];
    var el = document.createElement('div');
    el.className = 'theme-swatch' + (id === currentThemeId ? ' active' : '');
    el.style.background = t.accent;
    el.title = t.name;
    el.onclick = function() { onChange(id); };
    container.appendChild(el);
  });
}
