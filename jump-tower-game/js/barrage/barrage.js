// 弹幕系统

const { roundRect } = require('../drawer/helper');

const MAX_FLOATING_TEXTS = 18;
const PANEL_MESSAGE_LIMIT = 6;
const PANEL_SPRING = 0.22;
const PANEL_CLOSE_THRESHOLD = 0.35;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function trimText(text, maxLength) {
  const raw = String(text || '');
  if (raw.length <= maxLength) return raw;
  return raw.slice(0, Math.max(1, maxLength - 1)) + '…';
}

class Barrage {
  constructor() {
    this.floatingTexts = [];
    this.panelReveal = 0;
    this.panelTarget = 0;
    this.dragging = false;
    this.dragStartX = 0;
    this.dragStartReveal = 0;
  }

  // 显示浮动文字
  show(x, y, text, color) {
    if (!text) return;
    const now = Date.now();
    this.floatingTexts.push({
      x,
      y,
      text,
      color: color || '#ffdd57',
      toastLife: 1,
      vy: -1.1,
      createdAt: now,
      expiresAt: now + 8000
    });

    if (this.floatingTexts.length > MAX_FLOATING_TEXTS) {
      this.floatingTexts.splice(0, this.floatingTexts.length - MAX_FLOATING_TEXTS);
    }
  }

  // 更新浮动文字
  update() {
    const now = Date.now();
    this.panelReveal += (this.panelTarget - this.panelReveal) * PANEL_SPRING;
    if (Math.abs(this.panelTarget - this.panelReveal) < 0.01) {
      this.panelReveal = this.panelTarget;
    }

    this.floatingTexts = this.floatingTexts.filter(t => {
      if (t.toastLife > 0) {
        t.y += t.vy;
        t.toastLife -= 0.018;
      }
      return now < t.expiresAt;
    });
  }

  // 绘制浮动文字
  draw(ctx, W, H) {
    this.drawCompactToast(ctx, W);
    this.drawPanel(ctx, W, H);
  }

  // 清空
  clear() {
    this.floatingTexts = [];
    this.panelReveal = 0;
    this.panelTarget = 0;
    this.dragging = false;
  }

  getPanelLayout(W, H) {
    const panelW = Math.max(148, Math.min(188, Math.round(W * 0.4)));
    const panelH = Math.max(180, Math.min(H - 140, 260));
    const y = Math.max(96, Math.round(H * 0.24));
    const handleW = 28;
    const handleH = 92;
    const hiddenX = -panelW + 12;
    const openX = 0;
    const x = hiddenX + (openX - hiddenX) * this.panelReveal;
    return {
      x,
      y,
      w: panelW,
      h: panelH,
      hiddenX,
      openX,
      handleX: x + panelW - 12,
      handleY: y + Math.round((panelH - handleH) * 0.5),
      handleW,
      handleH
    };
  }

  shouldStartGesture(W, H, touchX, touchY) {
    const layout = this.getPanelLayout(W, H);
    const panelHit = this.panelReveal > 0.2 &&
      touchX >= layout.x &&
      touchX <= layout.x + layout.w + 16 &&
      touchY >= layout.y &&
      touchY <= layout.y + layout.h;
    const handleHit =
      touchX >= layout.handleX &&
      touchX <= layout.handleX + layout.handleW &&
      touchY >= layout.handleY &&
      touchY <= layout.handleY + layout.handleH;
    return panelHit || handleHit;
  }

  beginPanelDrag(W, H, touchX) {
    this.dragging = true;
    this.dragStartX = touchX;
    this.dragStartReveal = this.panelReveal;
  }

  updatePanelDrag(W, H, touchX) {
    if (!this.dragging) return;
    const layout = this.getPanelLayout(W, H);
    const travel = Math.max(1, layout.openX - layout.hiddenX);
    const deltaX = touchX - this.dragStartX;
    this.panelReveal = clamp(this.dragStartReveal + deltaX / travel, 0, 1);
    this.panelTarget = this.panelReveal;
  }

  endPanelDrag() {
    if (!this.dragging) return;
    this.dragging = false;
    this.panelTarget = this.panelReveal > PANEL_CLOSE_THRESHOLD ? 1 : 0;
  }

  closePanel() {
    this.panelTarget = 0;
  }

  drawCompactToast(ctx, W) {
    if (this.panelReveal > 0.92 || this.floatingTexts.length === 0) return;
    const latest = this.floatingTexts[this.floatingTexts.length - 1];
    if (!latest || latest.toastLife <= 0) return;

    const alpha = clamp(latest.toastLife, 0, 1) * (1 - this.panelReveal * 0.65);
    const text = trimText(latest.text, 18);
    const boxW = Math.max(104, Math.min(W - 110, text.length * 15 + 26));
    const x = (W - boxW) / 2;
    const y = 92 + (1 - latest.toastLife) * 12;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.72)';
    roundRect(ctx, x, y, boxW, 26, 13);
    ctx.fillStyle = latest.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + boxW / 2, y + 18);
    ctx.restore();
  }

  drawPanel(ctx, W, H) {
    const layout = this.getPanelLayout(W, H);
    const activeMessages = this.floatingTexts.slice(-PANEL_MESSAGE_LIMIT);

    ctx.save();
    ctx.globalAlpha = 0.72 + this.panelReveal * 0.28;
    ctx.fillStyle = 'rgba(7, 10, 20, 0.88)';
    roundRect(ctx, layout.x, layout.y, layout.w, layout.h, 16);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, layout.handleX, layout.handleY, layout.handleW, layout.handleH, 14);
    ctx.fillStyle = '#9ed8ff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('弹幕', layout.handleX + layout.handleW / 2, layout.handleY + 34);
    ctx.fillText(this.panelReveal > 0.5 ? '<<' : '>>', layout.handleX + layout.handleW / 2, layout.handleY + 58);

    if (this.panelReveal > 0.05) {
      ctx.globalAlpha = this.panelReveal;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('最近消息', layout.x + 16, layout.y + 24);

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '12px sans-serif';
      ctx.fillText('右滑展开，左滑收起', layout.x + 16, layout.y + 42);

      if (activeMessages.length === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText('暂无消息', layout.x + 16, layout.y + 78);
      } else {
        for (let i = 0; i < activeMessages.length; i++) {
          const entry = activeMessages[activeMessages.length - 1 - i];
          const itemY = layout.y + 62 + i * 28;
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          roundRect(ctx, layout.x + 12, itemY - 14, layout.w - 24, 22, 11);
          ctx.fillStyle = entry.color;
          ctx.font = '12px sans-serif';
          ctx.fillText(trimText(entry.text, 14), layout.x + 18, itemY + 1);
        }
      }
    }

    ctx.restore();
  }
}

module.exports = Barrage;
