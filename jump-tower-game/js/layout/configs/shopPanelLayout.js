module.exports = {
  "id": "shopPanel",
  "vars": {},
  "elements": [
    {
      "id": "shopBg", "type": "glassPanel",
      "anchor": { "x": "center", "y": "top" }, "offset": { "x": 0, "y": 76 },
      "size": { "width": 327, "height": 520 },
      "style": { "radius": 22, "glow": "$panelGlow", "shadowBlur": 12, "stroke": "$panelStroke", "innerStroke": "$panelInnerStroke", "stops": "$panelStrongStops", "consume": true }
    },
    {
      "id": "shopTitle", "type": "text",
      "anchor": { "x": "center", "y": "top" }, "offset": { "x": 0, "y": 96 },
      "size": { "width": 200, "height": 30 },
      "style": { "fontSize": 24, "fontWeight": "700", "textAlign": "center", "color": "$cardLabel", "text": "成长工坊" }
    },
    {
      "id": "shopCoins", "type": "text",
      "anchor": { "x": "center", "y": "top" }, "offset": { "x": 0, "y": 122 },
      "size": { "width": 200, "height": 20 },
      "style": { "fontSize": 16, "fontWeight": "700", "textAlign": "center", "color": "$cardMeta", "text": "当前金币: 0" }
    },
    {
      "id": "shopClose", "type": "closeButton",
      "anchor": { "x": "right", "y": "top" }, "offset": { "x": -64, "y": 88 },
      "size": { "width": 26, "height": 26 },
      "style": { "glow": "$panelGlow", "stroke": "$panelStroke" },
      "action": { "type": "close-panel", "panel": "showShopPanel" }
    },
    {
      "id": "shopTabs", "type": "flex",
      "anchor": { "x": "center", "y": "top" }, "offset": { "x": 0, "y": 152 },
      "size": { "width": 291, "height": 28 },
      "flex": { "direction": "row", "gap": 6, "justify": "center", "align": "center" },
      "children": [
        { "id": "tab.upgrades", "type": "roundRect", "size": { "width": 68, "height": 28 }, "style": { "radius": 14, "fill": "$accentSoft" }, "action": { "type": "shop-tab", "tabId": "upgrades" } },
        { "id": "tab.skills", "type": "roundRect", "size": { "width": 68, "height": 28 }, "style": { "radius": 14, "fill": "$chipFill" }, "action": { "type": "shop-tab", "tabId": "skills" } },
        { "id": "tab.trails", "type": "roundRect", "size": { "width": 68, "height": 28 }, "style": { "radius": 14, "fill": "$chipFill" }, "action": { "type": "shop-tab", "tabId": "trails" } },
        { "id": "tab.items", "type": "roundRect", "size": { "width": 68, "height": 28 }, "style": { "radius": 14, "fill": "$chipFill" }, "action": { "type": "shop-tab", "tabId": "items" } }
      ]
    }
  ]
};
