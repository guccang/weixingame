// 弹幕系统

const MAX_FLOATING_TEXTS = 48;

class Barrage {
  constructor() {
    this.floatingTexts = [];
  }

  // 显示浮动文字
  show(x, y, text, color) {
    if (!text) return;
    this.floatingTexts.push({
      x,
      y,
      text,
      color: color || '#ffdd57',
      life: 1,
      scale: 1,
      vy: -2
    });

    // 高频事件下限制弹幕堆积，避免长时间游玩后遍历成本持续增长
    if (this.floatingTexts.length > MAX_FLOATING_TEXTS) {
      this.floatingTexts.splice(0, this.floatingTexts.length - MAX_FLOATING_TEXTS);
    }
  }

  // 更新浮动文字
  update() {
    this.floatingTexts = this.floatingTexts.filter(t => {
      t.y += t.vy;
      t.life -= 0.012;
      return t.life > 0;
    });
  }

  // 绘制浮动文字
  draw(ctx, W) {
    for (let t of this.floatingTexts) {
      ctx.globalAlpha = t.life;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.fillText(t.text, Math.max(10, Math.min(W - 200, t.x)), t.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  // 清空
  clear() {
    this.floatingTexts = [];
  }
}

module.exports = Barrage;
