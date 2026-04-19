module.exports = {
  "id": "gameOverScreen",
  "vars": {},
  "elements": [
    {
      "id": "goBg", "type": "glassPanel",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": 0, "y": 0 },
      "size": { "width": 347, "height": 574 },
      "style": { "radius": 34, "innerStroke": "rgba(255,255,255,0.06)", "shadowBlur": 24, "glow": "rgba(112,196,255,0.14)", "stroke": "rgba(212,231,255,0.16)", "stops": [[0, "rgba(21,34,56,0.94)"], [1, "rgba(9,15,27,0.94)"]], "consume": true }
    },
    {
      "id": "goTitle", "type": "text",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": -80, "y": -222 },
      "size": { "width": 200, "height": 36 },
      "style": { "fontSize": 32, "fontWeight": "700", "color": "#ffffff", "text": "挑战结束" }
    },
    {
      "id": "goRestartBtn", "type": "actionButton",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": -108, "y": 240 },
      "size": { "width": 100, "height": 48 },
      "style": { "fontSize": 15, "fontWeight": "700", "textColor": "#03121f", "text": "再来一局" },
      "action": { "type": "game-restart" }
    },
    {
      "id": "goShareBtn", "type": "actionButton",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": 0, "y": 240 },
      "size": { "width": 100, "height": 48 },
      "style": { "fontSize": 15, "fontWeight": "700", "textColor": "#ffffff", "stops": [[0, "#ff9a71"], [0.55, "#ff7d8a"], [1, "#d85dff"]], "text": "转发" },
      "action": { "type": "game-share" }
    },
    {
      "id": "goHomeBtn", "type": "actionButton",
      "anchor": { "x": "center", "y": "center" }, "offset": { "x": 108, "y": 240 },
      "size": { "width": 100, "height": 48 },
      "style": { "fontSize": 15, "fontWeight": "700", "textColor": "#ffffff", "stops": [[0, "#7ab8ff"], [0.55, "#4f8fff"], [1, "#3158e8"]], "text": "返回主页" },
      "action": { "type": "game-home" }
    }
  ]
};
