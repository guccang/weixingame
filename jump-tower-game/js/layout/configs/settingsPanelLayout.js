module.exports = {
  "id": "settingsPanel",
  "vars": {},
  "elements": [
    {
      "id": "settingsBg", "type": "glassPanel",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": 0, "y": -20 },
      "size": { "width": 331, "height": 432 },
      "style": { "radius": 26, "glow": "$panelGlow", "shadowBlur": 14, "stroke": "$panelStroke", "innerStroke": "$panelInnerStroke", "stops": "$panelStrongStops", "consume": true }
    },
    {
      "id": "settingsTitle", "type": "text",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": 0, "y": -206 },
      "size": { "width": 200, "height": 30 },
      "style": { "fontSize": 24, "fontWeight": "700", "textAlign": "center", "color": "$cardLabel", "text": "界面设置" }
    },
    {
      "id": "settingsDesc", "type": "text",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": 0, "y": -182 },
      "size": { "width": 280, "height": 18 },
      "style": { "fontSize": 13, "textAlign": "center", "color": "$cardSubtle", "text": "切换整体 UI 质感和配色，立即生效。" }
    },
    {
      "id": "settingsClose", "type": "closeButton",
      "anchor": { "x": "right", "y": "center" }, "offset": { "x": -62, "y": -218 },
      "size": { "width": 26, "height": 26 },
      "style": { "glow": "$panelGlow", "stroke": "$panelStroke" },
      "action": { "type": "close-panel", "panel": "showSettingsPanel" }
    }
  ]
};
