/**
 * 宠物系统
 * 代码绘制的发光光球，跟随玩家中心右后方
 */

const PET_CONFIG = {
  offsetXRatio: 0.8,
  offsetYRatio: 0.45,
  followLerp: 0.12,
  driftStrengthX: 10,
  driftStrengthY: 8,
  floatAmplitudeY: 7,
  floatAmplitudeX: 3,
  floatSpeed: 0.004,
  wobbleSpeed: 0.0022,
  radius: 11,
  glowRadius: 28,
  shadowBlur: 18,
  trailPointCount: 10,
  trailMinDistance: 2.5,
  trailWidth: 12,
  coreColor: '#d8fff1',
  midColor: '#6df0b0',
  outerColor: '#1ea868',
  trailHeadColor: 'rgba(216, 255, 241, 0.38)',
  trailMidColor: 'rgba(109, 240, 176, 0.22)',
  trailTailColor: 'rgba(30, 168, 104, 0)'
};

function setPetConfig(partialConfig) {
  if (!partialConfig) return;
  Object.assign(PET_CONFIG, partialConfig);
}

function getPetConfig() {
  return Object.assign({}, PET_CONFIG);
}

function createPet(player) {
  const anchor = getPetAnchor(player, Date.now());
  return {
    x: anchor.x,
    y: anchor.y,
    anchorX: anchor.x,
    anchorY: anchor.y,
    targetX: anchor.x,
    targetY: anchor.y,
    vx: 0,
    vy: 0,
    radius: PET_CONFIG.radius,
    glowRadius: PET_CONFIG.glowRadius,
    phase: Math.random() * Math.PI * 2,
    seekWeight: 0,
    returningHome: false,
    nextCoinCollectAt: 0,
    lockedTargetX: null,
    lockedTargetY: null,
    trailPoints: [{ x: anchor.x, y: anchor.y }]
  };
}

function updatePet(pet, player, dt, now, seekTarget, resetDistance) {
  if (!pet || !player) return pet;

  const anchor = getPetAnchor(player, now, pet.phase);
  pet.anchorX = anchor.x;
  pet.anchorY = anchor.y;
  const shouldSeek = !!seekTarget && !pet.returningHome;
  pet.lockedTargetX = shouldSeek ? seekTarget.x : null;
  pet.lockedTargetY = shouldSeek ? seekTarget.y : null;
  pet.seekWeight += (((shouldSeek ? 1 : 0) - pet.seekWeight) * 0.12) * (dt / 16.67);
  const target = getPetTarget(anchor, shouldSeek ? seekTarget : null, pet.seekWeight);
  pet.targetX = target.x;
  pet.targetY = target.y;

  const dtFactor = dt / 16.67;
  pet.vx += (pet.targetX - pet.x) * PET_CONFIG.followLerp * dtFactor;
  pet.vy += (pet.targetY - pet.y) * PET_CONFIG.followLerp * dtFactor;
  pet.vx *= 0.82;
  pet.vy *= 0.82;
  pet.x += pet.vx * dtFactor;
  pet.y += pet.vy * dtFactor;

  if (pet.returningHome) {
    const dx = pet.x - anchor.x;
    const dy = pet.y - anchor.y;
    const limit = resetDistance || 24;
    if (dx * dx + dy * dy <= limit * limit) {
      pet.returningHome = false;
      pet.nextCoinCollectAt = 0;
    }
  }

  updatePetTrail(pet);
  return pet;
}

function getPetTarget(anchor, seekTarget, seekWeight) {
  if (!seekTarget || seekWeight <= 0.001) {
    return anchor;
  }

  return {
    x: anchor.x + (seekTarget.x - anchor.x) * Math.min(1, 0.2 + seekWeight * 1.1),
    y: anchor.y + (seekTarget.y - anchor.y) * Math.min(1, 0.2 + seekWeight * 1.1)
  };
}

function drawPet(ctx, pet, cameraY) {
  if (!pet) return;

  const x = pet.x;
  const y = pet.y - cameraY;
  drawPetTrail(ctx, pet, cameraY);
  drawPetTargetLink(ctx, pet, cameraY);
  const glow = ctx.createRadialGradient(x, y, pet.radius * 0.2, x, y, pet.glowRadius);
  glow.addColorStop(0, 'rgba(216, 255, 241, 0.95)');
  glow.addColorStop(0.35, 'rgba(109, 240, 176, 0.68)');
  glow.addColorStop(1, 'rgba(30, 168, 104, 0)');

  ctx.save();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, pet.glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'rgba(109, 240, 176, 0.45)';
  ctx.shadowBlur = PET_CONFIG.shadowBlur;
  ctx.fillStyle = PET_CONFIG.outerColor;
  ctx.beginPath();
  ctx.arc(x, y, pet.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = PET_CONFIG.midColor;
  ctx.beginPath();
  ctx.arc(x - 1.5, y - 1.5, pet.radius * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PET_CONFIG.coreColor;
  ctx.beginPath();
  ctx.arc(x - 3, y - 3, pet.radius * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPetTargetLink(ctx, pet, cameraY) {
  if (pet.lockedTargetX === null || pet.lockedTargetY === null || pet.seekWeight <= 0.04) {
    return;
  }

  const startX = pet.x;
  const startY = pet.y - cameraY;
  const endX = pet.lockedTargetX;
  const endY = pet.lockedTargetY - cameraY;
  const ctrlX = (startX + endX) * 0.5;
  const ctrlY = Math.min(startY, endY) - 18;
  const alpha = Math.min(0.45, pet.seekWeight * 0.42);

  ctx.save();
  ctx.strokeStyle = `rgba(109, 240, 176, ${alpha})`;
  ctx.lineWidth = 1.5 + pet.seekWeight * 1.5;
  ctx.shadowColor = `rgba(109, 240, 176, ${alpha * 0.9})`;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.stroke();

  ctx.fillStyle = `rgba(216, 255, 241, ${alpha * 1.4})`;
  ctx.beginPath();
  ctx.arc(endX, endY, 2.5 + pet.seekWeight * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getPetAnchor(player, now, phase) {
  const localPhase = phase || 0;
  const floatY = Math.sin(now * PET_CONFIG.floatSpeed + localPhase) * PET_CONFIG.floatAmplitudeY;
  const floatX = Math.cos(now * PET_CONFIG.wobbleSpeed + localPhase) * PET_CONFIG.floatAmplitudeX;
  const facingOffset = player.facing >= 0 ? 1 : -1;

  return {
    x: player.x + player.w * PET_CONFIG.offsetXRatio + facingOffset * PET_CONFIG.driftStrengthX + floatX,
    y: player.y + player.h * PET_CONFIG.offsetYRatio - PET_CONFIG.driftStrengthY + floatY
  };
}

function updatePetTrail(pet) {
  const points = pet.trailPoints || [];
  const last = points[0];
  if (!last) {
    pet.trailPoints = [{ x: pet.x, y: pet.y }];
    return;
  }

  const dx = pet.x - last.x;
  const dy = pet.y - last.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= PET_CONFIG.trailMinDistance) {
    points.unshift({ x: pet.x, y: pet.y });
    if (points.length > PET_CONFIG.trailPointCount) {
      points.length = PET_CONFIG.trailPointCount;
    }
  } else {
    points[0] = { x: pet.x, y: pet.y };
  }
  pet.trailPoints = points;
}

function drawPetTrail(ctx, pet, cameraY) {
  const points = pet.trailPoints;
  if (!points || points.length < 2) return;

  const screenPoints = points.map(function(point, index) {
    return {
      x: point.x,
      y: point.y - cameraY,
      width: PET_CONFIG.trailWidth * Math.max(0.16, 1 - index / points.length)
    };
  });

  const leftPoints = [];
  const rightPoints = [];
  for (let i = 0; i < screenPoints.length; i++) {
    const tangent = getTangent(screenPoints, i);
    const perpX = -tangent.y;
    const perpY = tangent.x;
    const width = screenPoints[i].width;
    leftPoints.push({
      x: screenPoints[i].x + perpX * width * 0.5,
      y: screenPoints[i].y + perpY * width * 0.5
    });
    rightPoints.push({
      x: screenPoints[i].x - perpX * width * 0.5,
      y: screenPoints[i].y - perpY * width * 0.5
    });
  }

  const head = screenPoints[0];
  const tail = screenPoints[screenPoints.length - 1];
  const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
  gradient.addColorStop(0, PET_CONFIG.trailHeadColor);
  gradient.addColorStop(0.45, PET_CONFIG.trailMidColor);
  gradient.addColorStop(1, PET_CONFIG.trailTailColor);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  traceSmoothEdge(ctx, leftPoints, false);
  traceSmoothEdge(ctx, rightPoints.slice().reverse(), true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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

function traceSmoothEdge(ctx, points, continuePath) {
  if (points.length === 0) return;
  if (!continuePath) {
    ctx.moveTo(points[0].x, points[0].y);
  } else {
    ctx.lineTo(points[0].x, points[0].y);
  }

  if (points.length === 1) return;

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
  createPet,
  updatePet,
  drawPet,
  setPetConfig,
  getPetConfig
};
