const physics = require('../physics/constants');
const gameConstants = require('./constants');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function round(value, precision) {
  const factor = Math.pow(10, precision || 0);
  return Math.round(value * factor) / factor;
}

function resolveRangeValue(config, progress) {
  const base = config.base;
  const maxValue = typeof config.max === 'number'
    ? config.max
    : base * (config.maxMultiplier || 1);
  return lerp(base, maxValue, progress);
}

function resolveDifficultyProgress(score) {
  const difficultyConfig = gameConstants.difficultyConfig;
  const start = Math.max(0, difficultyConfig.scoreRampStart || 0);
  const end = Math.max(start + 1, difficultyConfig.scoreRampEnd || start + 1);
  return clamp((score - start) / (end - start), 0, 1);
}

class DifficultyManager {
  constructor() {
    this.basePhysics = {
      GRAVITY: physics.GRAVITY,
      PLAYER_SPEED: physics.PLAYER_SPEED,
      JUMP_FORCE: physics.JUMP_FORCE,
      BOOST_JUMP_FORCE: physics.BOOST_JUMP_FORCE,
      DOUBLE_JUMP_FORCE: physics.DOUBLE_JUMP_FORCE,
      MAX_FALL_SPEED: physics.MAX_FALL_SPEED
    };
    this.frozenScore = null;
    this.currentProfile = this.getProfile(0);
  }

  setDebugProfile(profile) {
    this.frozenScore = profile && profile.enabled && profile.difficultyMode === 'frozen' ? 0 : null;
    this.currentProfile = this.getProfile(this.currentProfile ? this.currentProfile.score : 0);
  }

  syncBasePhysics(game) {
    if (!game) return;

    const baseStats = game.baseStats || {};
    this.basePhysics = {
      GRAVITY: typeof baseStats.GRAVITY === 'number' ? baseStats.GRAVITY : physics.GRAVITY,
      PLAYER_SPEED: typeof game.PLAYER_SPEED === 'number' ? game.PLAYER_SPEED : physics.PLAYER_SPEED,
      JUMP_FORCE: typeof game.JUMP_FORCE === 'number' ? game.JUMP_FORCE : physics.JUMP_FORCE,
      BOOST_JUMP_FORCE: typeof game.BOOST_JUMP_FORCE === 'number' ? game.BOOST_JUMP_FORCE : physics.BOOST_JUMP_FORCE,
      DOUBLE_JUMP_FORCE: typeof game.DOUBLE_JUMP_FORCE === 'number' ? game.DOUBLE_JUMP_FORCE : physics.DOUBLE_JUMP_FORCE,
      MAX_FALL_SPEED: typeof baseStats.MAX_FALL_SPEED === 'number' ? baseStats.MAX_FALL_SPEED : physics.MAX_FALL_SPEED
    };
  }

  reset() {
    this.currentProfile = this.getProfile(0);
    return this.currentProfile;
  }

  update(score) {
    this.currentProfile = this.getProfile(score);
    return this.currentProfile;
  }

  getProfile(score) {
    const resolvedScore = typeof this.frozenScore === 'number' ? this.frozenScore : score;
    const safeScore = Math.max(0, Math.floor(resolvedScore || 0));
    const difficultyConfig = gameConstants.difficultyConfig;
    const progress = resolveDifficultyProgress(safeScore);

    return {
      score: safeScore,
      stage: Math.floor(safeScore / difficultyConfig.stageHeight),
      progress: round(progress, 3),
      platformGapMin: Math.round(resolveRangeValue(difficultyConfig.platformGapMin, progress)),
      platformGapMax: Math.round(resolveRangeValue(difficultyConfig.platformGapMax, progress)),
      playerSpeedMultiplier: round(resolveRangeValue(difficultyConfig.playerSpeedMultiplier, progress), 3),
      maxFallSpeedMultiplier: round(resolveRangeValue(difficultyConfig.maxFallSpeedMultiplier, progress), 3),
      movingPlatformSpeedMultiplier: round(resolveRangeValue(difficultyConfig.movingPlatformSpeedMultiplier, progress), 3)
    };
  }

  getCurrentProfile() {
    return this.currentProfile;
  }

  applyToGame(game) {
    if (!game) return this.currentProfile;

    const profile = this.currentProfile || this.getProfile(0);
    const base = this.basePhysics;

    physics.GRAVITY = base.GRAVITY;
    physics.PLAYER_SPEED = round(base.PLAYER_SPEED * profile.playerSpeedMultiplier, 3);
    physics.JUMP_FORCE = base.JUMP_FORCE;
    physics.BOOST_JUMP_FORCE = base.BOOST_JUMP_FORCE;
    physics.DOUBLE_JUMP_FORCE = base.DOUBLE_JUMP_FORCE;
    physics.MAX_FALL_SPEED = round(base.MAX_FALL_SPEED * profile.maxFallSpeedMultiplier, 3);

    game.GRAVITY = physics.GRAVITY;
    game.PLAYER_SPEED = physics.PLAYER_SPEED;
    game.JUMP_FORCE = physics.JUMP_FORCE;
    game.BOOST_JUMP_FORCE = physics.BOOST_JUMP_FORCE;
    game.DOUBLE_JUMP_FORCE = physics.DOUBLE_JUMP_FORCE;
    game.MAX_FALL_SPEED = physics.MAX_FALL_SPEED;
    game.currentDifficulty = profile;

    return profile;
  }

  applyPlatformModifiers(platform, score) {
    if (!platform) return platform;

    const profile = this.getProfile(score);
    platform.difficultyStage = profile.stage;
    if (platform.type === 'moving') {
      platform.moveSpeed = round((platform.moveSpeed || 0) * profile.movingPlatformSpeedMultiplier, 3);
    }
    return platform;
  }
}

module.exports = DifficultyManager;
