/**
 * 背景绘制模块
 * 使用 Bg01_01 + Bg01_02 拼接实现无限滚屏（垂直滚动）
 */

// Bg01 图片尺寸（544x976）
const BG_HEIGHT = 976;
// 背景滚动速度系数（绝对值为相对于相机的速度比，负数=反方向）
// -0.5 = 反方向、半速滚动
const BG_SCROLL_SPEED = 0.2;

/**
 * 绘制滚屏背景
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @param {number} cameraY - 相机Y偏移
 * @param {number} score - 当前分数
 * @param {Array} bgStars - 背景星星数组（兼容旧参数）
 * @param {Object} images - 图片资源对象
 */
function drawBackground(ctx, W, H, cameraY, score, bgStars, images) {
  // 如果有 Bg01 图片，使用滚屏背景
  if (images && images.bg0101 && images.bg0102 &&
      images.bg0101.width > 0 && images.bg0102.width > 0) {
    drawScrollingBackground(ctx, W, H, cameraY, images);
  } else {
    // 备用：绘制渐变背景
    drawGradientBackground(ctx, W, H, cameraY, score, bgStars);
  }
}

/**
 * 绘制滚屏背景（垂直滚动，无限循环）
 * 两张图片交替拼接：bg0101, bg0102, bg0101, bg0102, ...
 * 玩家向上跳时，背景向下滚动（视差效果）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @param {number} cameraY - 相机Y偏移
 * @param {Object} images - 图片资源
 */
function drawScrollingBackground(ctx, W, H, cameraY, images) {
  const scrollOffset = cameraY * BG_SCROLL_SPEED;

  // 世界坐标中屏幕顶部对应的位置
  const worldTop = scrollOffset;
  // 找到第一个图片槽位的索引（每个槽位高度为 BG_HEIGHT）
  const slotIndex = Math.floor(worldTop / BG_HEIGHT);
  // 该槽位在世界中的起始位置
  const slotWorldTop = slotIndex * BG_HEIGHT;
  // 该槽位在屏幕上的 y 坐标（可能为负，表示只显示图片下半部分）
  let y = slotWorldTop - worldTop;
  let idx = slotIndex;

  // 从上方开始交替绘制 bg0101 / bg0102，直到覆盖整个屏幕
  while (y < H) {
    const img = (((idx % 2) + 2) % 2 === 0) ? images.bg0101 : images.bg0102;
    ctx.drawImage(img, 0, y, W, BG_HEIGHT);
    y += BG_HEIGHT;
    idx++;
  }
}

/**
 * 绘制渐变背景（备用方案）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @param {number} cameraY - 相机Y偏移
 * @param {number} score - 当前分数
 * @param {Array} bgStars - 背景星星数组
 */
function drawGradientBackground(ctx, W, H, cameraY, score, bgStars) {
  const heightRatio = Math.min(score / 2000, 1);
  const grad = ctx.createLinearGradient(0, 0, 0, H);

  if (heightRatio < 0.3) {
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(1, '#1a1a4e');
  } else if (heightRatio < 0.6) {
    grad.addColorStop(0, '#0d0d3d');
    grad.addColorStop(1, '#2d1b69');
  } else {
    grad.addColorStop(0, '#000020');
    grad.addColorStop(1, '#1a0a3e');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 绘制星星
  if (bgStars) {
    for (let s of bgStars) {
      s.twinkle += 0.02;
      const sy = (s.y - cameraY * 0.3) % (H * 10);
      const alpha = 0.5 + Math.sin(s.twinkle) * 0.5;
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, sy % H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 绘制高度标尺
  const startH = Math.floor((-cameraY) / 200) * 200;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '12px sans-serif';
  for (let h = startH; h < startH + H + 400; h += 200) {
    const sy = h + cameraY;
    if (sy > 0 && sy < H) {
      const meters = Math.floor((-h + H - 100) / 10);
      if (meters > 0) {
        ctx.fillText(meters + 'm', W - 50, sy);
        ctx.fillRect(0, sy, W, 1);
      }
    }
  }
}

/**
 * 绘制开始界面背景
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @param {Object} images - 图片资源
 */
function drawStartBackground(ctx, W, H, images) {
  // 优先使用 Bg01 背景
  if (images && images.bg0101 && images.bg0102 &&
      images.bg0101.width > 0 && images.bg0102.width > 0) {
    // 水平拉伸 Bg01 图片覆盖整个屏幕
    // Bg01_01 在上，Bg01_02 在下，垂直拼接后拉伸覆盖屏幕
    ctx.drawImage(images.bg0101, 0, 0, W, BG_HEIGHT);
    ctx.drawImage(images.bg0102, 0, BG_HEIGHT, W, BG_HEIGHT);
    return;
  }

  // 备用：使用 bgMain
  if (images && images.bgMain && images.bgMain.width > 0) {
    const scale = Math.max(W / images.bgMain.width, H / images.bgMain.height);
    const imgW = images.bgMain.width * scale;
    const imgH = images.bgMain.height * scale;
    const imgX = (W - imgW) / 2;
    const imgY = (H - imgH) / 2;
    ctx.drawImage(images.bgMain, imgX, imgY, imgW, imgH);
    return;
  }

  // 最终备用：渐变背景
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(1, '#1a1a4e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

/**
 * 绘制游戏结束界面背景
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @param {number} cameraY - 相机Y偏移
 * @param {number} score - 当前分数
 * @param {Array} bgStars - 背景星星数组
 * @param {Object} images - 图片资源
 */
function drawGameOverBackground(ctx, W, H, cameraY, score, bgStars, images) {
  // 如果有 Bg01 图片，使用滚屏背景（静止状态）
  if (images && images.bg0101 && images.bg0102 &&
      images.bg0101.width > 0 && images.bg0102.width > 0) {
    // 游戏结束时背景静止，不滚动
    for (let x = 0; x < W; x += BG_WIDTH) {
      ctx.drawImage(images.bg0101, x, 0, BG_WIDTH, Math.min(BG_HEIGHT, H));
      if (x + BG_WIDTH < W + BG_WIDTH) {
        ctx.drawImage(images.bg0102, x + BG_WIDTH, 0, BG_WIDTH, Math.min(BG_HEIGHT, H));
      }
    }
    return;
  }

  // 备用：渐变背景
  drawGradientBackground(ctx, W, H, cameraY, score, bgStars);
}

module.exports = {
  drawBackground,
  drawStartBackground,
  drawGameOverBackground
};
