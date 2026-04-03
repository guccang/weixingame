/**
 * 物理节点飘带拖尾
 */

const trailConfig = {
  nodeCount: 20,
  baseSegmentLength: 15,
  minSegmentLength: 13,
  maxSegmentLength: 30,
  followStiffness: 0.26,
  damping: 0.78,
  sway: 0.18,
  alphaShowLerp: 0.16,
  alphaHideLerp: 0.05,
  lengthGrowLerp: 0.16,
  lengthShrinkLerp: 0.02,
  width: 14,
  anchorOffsetXRatio: 0.18,
  anchorOffsetYRatio: 0.88,
  speedLengthBase: 10,
  speedLengthFactor: 0.7,
  bodyColors: [
    { stop: 0, color: { r: 146, g: 18, b: 36, a: 0.48 } },
    { stop: 0.35, color: { r: 120, g: 10, b: 28, a: 0.38 } },
    { stop: 0.75, color: { r: 94, g: 8, b: 24, a: 0.24 } },
    { stop: 1, color: { r: 70, g: 6, b: 20, a: 0 } }
  ],
  shadowColor: { r: 124, g: 14, b: 34, a: 0.24 },
  shadowBlur: 12,
  ionParticleCount: 8,
  ionSpawnSpread: 7,
  ionSpeed: 1.8,
  ionRadius: 1.8,
  ionLife: 18,
  ionColor: { r: 198, g: 58, b: 76, a: 0.42 },
  headRibbon: {
    enabled: true,
    width: 6,
    anchorOffsetXRatio: 0.16,
    anchorOffsetYRatio: 0.18,
    speedLengthBase: 4,
    speedLengthFactor: 0.16,
    minSegmentLength: 3,
    maxSegmentLength: 10,
    bodyColors: [
      { stop: 0, color: { r: 86, g: 240, b: 154, a: 0.42 } },
      { stop: 0.4, color: { r: 44, g: 192, b: 118, a: 0.32 } },
      { stop: 1, color: { r: 20, g: 120, b: 74, a: 0 } }
    ],
    shadowColor: { r: 52, g: 220, b: 132, a: 0.22 },
    shadowBlur: 8,
    ionParticleCount: 4,
    ionSpawnSpread: 4,
    ionSpeed: 1.0,
    ionRadius: 1.1,
    ionLife: 10,
    ionColor: { r: 92, g: 255, b: 172, a: 0.36 },
    idleWindX: -0.85,
    idleWindY: -0.55,
    waveAmplitude: 1.8,
    waveFrequency: 0.45,
    waveSpeed: 0.22
  }
};

function setTrailConfig(partialConfig) {
  if (!partialConfig) return;
  Object.assign(trailConfig, partialConfig);
}

function getTrailConfig() {
  return JSON.parse(JSON.stringify(trailConfig));
}

function shouldSpawnJumpTrail(player) {
  if (!player) return false;
  if (player.vy >= 0) return false;
  return player.state === 'jump' || player.state === 'rise';
}

function shouldSpawnHeadTrail(player) {
  if (!player || !trailConfig.headRibbon.enabled) return false;
  return Math.abs(player.vx) > 1.2 || player.vy > 1.5;
}

function spawnRibbon(player, now, type) {
  const anchor = getAnchorPoint(player, type);
  const config = getRibbonRenderConfig(type);
  const nodes = [];
  for (let i = 0; i < trailConfig.nodeCount; i++) {
    nodes.push({
      x: anchor.x,
      y: anchor.y + i * trailConfig.baseSegmentLength * 0.72,
      vx: 0,
      vy: 0
    });
  }

  return {
    createdAt: now,
    type,
    active: true,
    alpha: 0,
    targetAlpha: 1,
    widthBase: config.width * (player.scale || 1),
    segmentLength: trailConfig.baseSegmentLength,
    ionParticles: [],
    nodes
  };
}

function updateTrails(trails, player, dt, now) {
  const nextTrails = trails ? trails.slice() : [];
  syncRibbon(nextTrails, player, now, 'main', shouldSpawnJumpTrail(player));
  syncRibbon(nextTrails, player, now, 'head', shouldSpawnHeadTrail(player));

  for (let i = nextTrails.length - 1; i >= 0; i--) {
    const ribbon = nextTrails[i];
    if (player) {
      const scale = player.scale || 1;
      const config = getRibbonRenderConfig(ribbon.type);
      ribbon.widthBase += (config.width * scale - ribbon.widthBase) * 0.18;
      const speed = ribbon.type === 'head'
        ? Math.abs(player.vx)
        : Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      const minSegmentLength = config.minSegmentLength !== undefined
        ? config.minSegmentLength
        : trailConfig.minSegmentLength;
      const maxSegmentLength = config.maxSegmentLength !== undefined
        ? config.maxSegmentLength
        : trailConfig.maxSegmentLength;
      const targetSegmentLength = Math.max(
        minSegmentLength,
        Math.min(maxSegmentLength, config.speedLengthBase + speed * config.speedLengthFactor)
      );
      const lengthLerp = targetSegmentLength > ribbon.segmentLength
        ? trailConfig.lengthGrowLerp
        : trailConfig.lengthShrinkLerp;
      ribbon.segmentLength += (targetSegmentLength - ribbon.segmentLength) * lengthLerp;
    }

    updateRibbonPhysics(ribbon, player, dt, now);
    updateIonParticles(ribbon, dt);

    if (!ribbon.active && ribbon.alpha < 0.03) {
      nextTrails.splice(i, 1);
    }
  }

  return nextTrails;
}

function syncRibbon(trails, player, now, type, shouldActivate) {
  let ribbon = trails.find(item => item.type === type);
  if (shouldActivate && !ribbon) {
    ribbon = spawnRibbon(player, now, type);
    trails.push(ribbon);
  }
  if (ribbon) {
    ribbon.active = shouldActivate;
    ribbon.targetAlpha = shouldActivate ? 1 : 0;
  }
}

function updateRibbonPhysics(ribbon, player, dt, now) {
  const dtFactor = dt / 16.67;
  const alphaLerp = ribbon.targetAlpha > ribbon.alpha
    ? trailConfig.alphaShowLerp
    : trailConfig.alphaHideLerp;
  ribbon.alpha += (ribbon.targetAlpha - ribbon.alpha) * alphaLerp * dtFactor;

  if (!player) return;

  const anchor = getAnchorPoint(player, ribbon.type);
  const drift = getRibbonDriftDirection(player, ribbon.type);
  const nodes = ribbon.nodes;
  const head = nodes[0];
  const previousHeadX = head.x;
  const previousHeadY = head.y;
  head.x = anchor.x;
  head.y = anchor.y;
  head.vx = anchor.x - previousHeadX;
  head.vy = anchor.y - previousHeadY;
  const waveOffset = ribbon.type === 'head'
    ? Math.sin(now * trailConfig.headRibbon.waveSpeed) * trailConfig.headRibbon.waveAmplitude
    : 0;

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const node = nodes[i];
    const dx = prev.x - node.x;
    const dy = prev.y - node.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const stretch = dist - ribbon.segmentLength;
    const pull = stretch * trailConfig.followStiffness * dtFactor;
    const swayDirection = player.facing < 0 ? -1 : 1;
    const swayForce = ribbon.type === 'head' ? trailConfig.sway : 0;
    const waveY = ribbon.type === 'head'
      ? Math.sin(now * trailConfig.headRibbon.waveSpeed + i * trailConfig.headRibbon.waveFrequency) * waveOffset
      : 0;
    const desiredX = prev.x + drift.x * ribbon.segmentLength;
    const desiredY = prev.y + drift.y * ribbon.segmentLength + waveY;

    node.vx += (dx / dist) * pull + swayDirection * swayForce * i * 0.03;
    node.vx += (desiredX - node.x) * 0.08 * dtFactor;
    node.vy += (desiredY - node.y) * 0.08 * dtFactor;
    node.vy += ribbon.type === 'head' ? -0.01 * i : 0.02 * i;
    node.vx *= trailConfig.damping;
    node.vy *= trailConfig.damping;
    node.x += node.vx * dtFactor;
    node.y += node.vy * dtFactor;
    if (ribbon.type === 'head') {
      node.y = Math.min(node.y, anchor.y);
    }
  }

  // 多做几次约束，保证整条带子更连续，减少折断感
  for (let pass = 0; pass < 3; pass++) {
    nodes[0].x = anchor.x;
    nodes[0].y = anchor.y;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const node = nodes[i];
      const waveY = ribbon.type === 'head'
        ? Math.sin(now * trailConfig.headRibbon.waveSpeed + i * trailConfig.headRibbon.waveFrequency) * waveOffset
        : 0;
      const targetX = prev.x + drift.x * ribbon.segmentLength;
      const targetY = prev.y + drift.y * ribbon.segmentLength + waveY;
      const dx = node.x - targetX;
      const dy = node.y - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desired = ribbon.segmentLength;
      const ratio = desired / dist;
      node.x = targetX + dx * ratio;
      node.y = targetY + dy * ratio;
      if (ribbon.type === 'head') {
        node.y = Math.min(node.y, anchor.y);
      }
    }
  }

  spawnIonParticles(ribbon);
}

function drawTrails(ctx, trails, cameraY) {
  if (!trails || trails.length === 0) return;
  for (const ribbon of trails) {
    if (!ribbon || ribbon.nodes.length < 3 || ribbon.alpha <= 0.01) continue;

    const sampled = ribbon.nodes.map(node => ({
      x: node.x,
      y: node.y - cameraY,
      width: ribbon.widthBase * ribbon.alpha
    }));

    const leftPoints = [];
    const rightPoints = [];

    for (let i = 0; i < sampled.length; i++) {
      const tangent = getTangent(sampled, i);
      const perpX = -tangent.y;
      const perpY = tangent.x;
      const width = sampled[i].width;

      leftPoints.push({
        x: sampled[i].x + perpX * width * 0.5,
        y: sampled[i].y + perpY * width * 0.5
      });
      rightPoints.push({
        x: sampled[i].x - perpX * width * 0.5,
        y: sampled[i].y - perpY * width * 0.5
      });
    }

    drawRibbonBody(ctx, leftPoints, rightPoints, sampled, ribbon.alpha, ribbon.type);
    drawIonParticles(ctx, ribbon.ionParticles, cameraY, ribbon.type);
  }
}

function getAnchorPoint(player, type) {
  const config = getRibbonRenderConfig(type);
  return {
    x: player.x + player.w / 2 - player.facing * player.w * config.anchorOffsetXRatio,
    y: player.y + player.h * config.anchorOffsetYRatio
  };
}

function getRibbonRenderConfig(type) {
  if (type === 'head') {
    return trailConfig.headRibbon;
  }
  return trailConfig;
}

function getRibbonDriftDirection(player, type) {
  if (type === 'head') {
    const config = trailConfig.headRibbon;
    const isFalling = player.vy > 1.5;
    const isMoving = Math.abs(player.vx) > 1.2;
    const vx = isMoving ? -player.vx : config.idleWindX;
    const vy = isFalling ? -Math.abs(player.vy) : config.idleWindY;
    const length = Math.sqrt(vx * vx + vy * vy) || 1;
    return {
      x: vx / length,
      y: vy / length
    };
  }

  const vx = -player.vx;
  const vy = -player.vy + 1.2;
  const length = Math.sqrt(vx * vx + vy * vy) || 1;
  return {
    x: vx / length,
    y: vy / length
  };
}

function getTangent(points, index) {
  const prev = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: dx / length,
    y: dy / length
  };
}

function drawRibbonBody(ctx, leftPoints, rightPoints, spinePoints, alpha, type) {
  const head = spinePoints[0];
  const tail = spinePoints[spinePoints.length - 1];
  const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
  const config = getRibbonRenderConfig(type);
  for (const stop of config.bodyColors) {
    gradient.addColorStop(stop.stop, toRgba(stop.color, alpha));
  }

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.shadowColor = toRgba(config.shadowColor, alpha);
  ctx.shadowBlur = config.shadowBlur * alpha;
  ctx.beginPath();
  traceSmoothEdge(ctx, leftPoints, false);
  traceSmoothEdge(ctx, rightPoints.slice().reverse(), true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function spawnIonParticles(ribbon) {
  const config = getRibbonRenderConfig(ribbon.type);
  const tailNode = ribbon.nodes[ribbon.nodes.length - 1];
  const nearTailNode = ribbon.nodes[Math.max(0, ribbon.nodes.length - 3)];
  if (!tailNode || !nearTailNode || ribbon.alpha < 0.08) return;

  while (ribbon.ionParticles.length < config.ionParticleCount) {
    const vx = (Math.random() - 0.5) * config.ionSpeed + (tailNode.x - nearTailNode.x) * 0.03;
    const vy = (Math.random() - 0.5) * config.ionSpeed + (tailNode.y - nearTailNode.y) * 0.03;
    ribbon.ionParticles.push({
      x: tailNode.x + (Math.random() - 0.5) * config.ionSpawnSpread,
      y: tailNode.y + (Math.random() - 0.5) * config.ionSpawnSpread,
      vx,
      vy,
      life: config.ionLife,
      maxLife: config.ionLife,
      r: config.ionRadius * (0.7 + Math.random() * 0.6)
    });
  }
}

function updateIonParticles(ribbon, dt) {
  ribbon.ionParticles = ribbon.ionParticles.filter(particle => {
    particle.x += particle.vx * (dt / 16.67);
    particle.y += particle.vy * (dt / 16.67);
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    particle.life -= dt / 16.67;
    return particle.life > 0;
  });
}

function drawIonParticles(ctx, particles, cameraY, type) {
  if (!particles || particles.length === 0) return;
  const config = getRibbonRenderConfig(type);

  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.save();
    ctx.fillStyle = toRgba(config.ionColor, alpha);
    ctx.shadowColor = toRgba(config.ionColor, alpha * 0.8);
    ctx.shadowBlur = 6 * alpha;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y - cameraY, particle.r * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function toRgba(color, alphaScale) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * alphaScale})`;
}

function traceSmoothEdge(ctx, points, continuePath) {
  if (points.length === 0) return;
  if (!continuePath) {
    ctx.moveTo(points[0].x, points[0].y);
  } else {
    ctx.lineTo(points[0].x, points[0].y);
  }

  if (points.length === 1) {
    return;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) * 0.5;
    const midY = (current.y + next.y) * 0.5;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

module.exports = {
  trailConfig,
  setTrailConfig,
  getTrailConfig,
  shouldSpawnJumpTrail,
  shouldSpawnHeadTrail,
  spawnJumpTrail: spawnRibbon,
  updateTrails,
  drawTrails
};
