const __ = {
  poolDic: Symbol('poolDic'),
};

/**
 * 简易的对象池实现
 */
class Pool {
  constructor() {
    this[__.poolDic] = {};
  }

  getPoolBySign(name) {
    return this[__.poolDic][name] || (this[__.poolDic][name] = []);
  }

  getItemByClass(name, className) {
    const pool = this.getPoolBySign(name);
    return pool.length ? pool.shift() : new className();
  }

  recover(name, instance) {
    this.getPoolBySign(name).push(instance);
  }
}

module.exports = Pool;
