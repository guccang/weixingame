/**
 * 物理模块入口
 */

const constants = require('./constants');
const platform = require('./platform');
const player = require('./player');
const particle = require('./particle');

module.exports = {
  constants,
  platform,
  player,
  particle
};
