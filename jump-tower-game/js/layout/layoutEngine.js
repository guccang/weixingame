/**
 * 布局引擎核心
 * 解析JSON配置，计算UI元素位置
 */

class LayoutEngine {
  constructor() {
    this.layouts = {};      // 缓存加载的布局配置
    this.templates = {};    // 组件模板
    this.vars = {};         // 全局变量
  }

  /**
   * 加载布局配置
   * @param {string} id - 布局ID
   * @param {Object} config - 布局配置对象
   */
  loadLayout(id, config) {
    // 合并全局变量
    if (config.vars) {
      this.vars = { ...this.vars, ...config.vars };
    }
    // 预处理变量引用
    this.layouts[id] = this._preprocessConfig(config);
    return this;
  }

  /**
   * 加载组件模板
   * @param {string} id - 模板ID
   * @param {Object} template - 模板配置
   */
  loadTemplate(id, template) {
    this.templates[id] = template;
    return this;
  }

  /**
   * 预处理配置，解析变量引用
   * @param {Object} config - 原始配置
   * @returns {Object} 处理后的配置
   */
  _preprocessConfig(config) {
    const str = JSON.stringify(config);
    const processed = str.replace(/\$\{(\w+)\}/g, (match, varName) => {
      const value = this.vars[varName];
      return value !== undefined ? value : match;
    });
    return JSON.parse(processed);
  }

  /**
   * 解析布局，计算所有元素的实际位置
   * @param {string} layoutId - 布局ID
   * @param {number} W - 容器宽度
   * @param {number} H - 容器高度
   * @returns {Object} 解析后的布局，包含elements及其bounds
   */
  resolveLayout(layoutId, W, H) {
    const layout = this.layouts[layoutId];
    if (!layout) {
      console.warn(`Layout not found: ${layoutId}`);
      return { elements: {} };
    }

    const resolvedElements = {};
    const elementsList = [];

    // 第一遍：计算非flex元素的bounds
    if (layout.elements) {
      layout.elements.forEach((el, index) => {
        const resolved = this._resolveElement(el, W, H, W, H);
        if (resolved) {
          resolvedElements[el.id || `element_${index}`] = resolved;
          elementsList.push(resolved);
        }
      });
    }

    return {
      id: layoutId,
      elements: resolvedElements,
      elementsList: elementsList,
      width: W,
      height: H
    };
  }

  /**
   * 解析单个元素
   * @param {Object} el - 元素配置
   * @param {number} containerW - 父容器宽度
   * @param {number} containerH - 父容器高度
   * @param {number} screenW - 屏幕总宽度
   * @param {number} screenH - 屏幕总高度
   * @returns {Object} 解析后的元素，包含bounds和原始配置
   */
  _resolveElement(el, containerW, containerH, screenW, screenH) {
    // 如果引用模板，先合并模板配置
    let config = el;
    if (el.template && this.templates[el.template]) {
      config = this._mergeTemplate(el, this.templates[el.template]);
    }

    // 计算尺寸
    const size = this._resolveSize(config.size, containerW, containerH);

    // 计算锚点位置
    const anchor = config.anchor || { x: 'left', y: 'top' };
    const anchorPoint = this._calculateAnchorPoint(anchor, containerW, containerH, size);

    // 计算偏移
    const offset = this._resolveOffset(config.offset, containerW, containerH);

    // 最终位置
    const bounds = {
      x: anchorPoint.x + offset.x,
      y: anchorPoint.y + offset.y,
      width: size.width,
      height: size.height
    };

    const result = {
      id: config.id,
      type: config.type,
      bounds: bounds,
      style: config.style || {},
      textKey: config.textKey,
      imageKey: config.imageKey,
      visibleWhen: config.visibleWhen,
      action: config.action
    };

    // 处理Flex布局的子元素
    if (config.type === 'flex' && config.children) {
      result.children = this._resolveFlexChildren(config, bounds, screenW, screenH);
    }

    // 处理普通子元素
    if (config.children && config.type !== 'flex') {
      result.children = config.children.map(child =>
        this._resolveElement(child, size.width, size.height, screenW, screenH)
      );
    }

    return result;
  }

  /**
   * 合并模板配置
   */
  _mergeTemplate(el, template) {
    const merged = { ...template.props, ...el };
    if (el.override) {
      merged.style = { ...template.props.style, ...el.override.style };
      delete merged.override;
    }
    return merged;
  }

  /**
   * 解析尺寸
   * @param {Object} size - 尺寸配置
   * @param {number} containerW - 容器宽度
   * @param {number} containerH - 容器高度
   * @returns {Object} { width, height }
   */
  _resolveSize(size, containerW, containerH) {
    if (!size) {
      return { width: 0, height: 0 };
    }

    return {
      width: this._parseValue(size.width, containerW),
      height: this._parseValue(size.height, containerH)
    };
  }

  /**
   * 解析偏移
   */
  _resolveOffset(offset, containerW, containerH) {
    if (!offset) return { x: 0, y: 0 };

    return {
      x: this._parseValue(offset.x, containerW),
      y: this._parseValue(offset.y, containerH)
    };
  }

  /**
   * 解析值（支持固定值和百分比）
   */
  _parseValue(value, base) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.endsWith('%')) {
        return (parseFloat(value) / 100) * base;
      }
      return parseFloat(value) || 0;
    }
    return 0;
  }

  /**
   * 计算锚点位置
   * @param {Object} anchor - 锚点配置 { x: 'left'|'center'|'right', y: 'top'|'center'|'bottom' }
   * @param {number} W - 容器宽度
   * @param {number} H - 容器高度
   * @param {Object} size - 元素尺寸 { width, height }
   * @returns {Object} { x, y }
   */
  _calculateAnchorPoint(anchor, W, H, size) {
    let baseX = 0, baseY = 0;

    // X锚点
    if (anchor.x === 'center') {
      baseX = (W - size.width) / 2;
    } else if (anchor.x === 'right') {
      baseX = W - size.width;
    }
    // 'left' 默认为 0

    // Y锚点
    if (anchor.y === 'center') {
      baseY = (H - size.height) / 2;
    } else if (anchor.y === 'bottom') {
      baseY = H - size.height;
    }
    // 'top' 默认为 0

    return { x: baseX, y: baseY };
  }

  /**
   * 解析Flex布局的子元素
   */
  _resolveFlexChildren(config, parentBounds, screenW, screenH) {
    const children = config.children || [];
    const flex = config.flex || {};
    const direction = flex.direction || 'row';
    const gap = flex.gap || 0;
    const justify = flex.justify || 'start';
    const align = flex.align || 'center';

    const isRow = direction === 'row';
    const mainAxis = isRow ? 'width' : 'height';
    const crossAxis = isRow ? 'height' : 'width';
    const containerMain = parentBounds[mainAxis];
    const containerCross = parentBounds[crossAxis];

    // 计算所有子元素的总尺寸
    let totalMainSize = 0;
    const resolvedChildren = children.map(child => {
      const size = this._resolveSize(child.size, containerMain, containerCross);
      totalMainSize += size[mainAxis];
      return { ...child, _resolvedSize: size };
    });

    const totalGap = gap * (children.length - 1);
    const totalUsed = totalMainSize + totalGap;
    const freeSpace = containerMain - totalUsed;

    // 计算起始位置（基于justify）
    let startPos = 0;
    let itemGap = gap;

    if (justify === 'center') {
      startPos = freeSpace / 2;
    } else if (justify === 'end') {
      startPos = freeSpace;
    } else if (justify === 'space-between') {
      itemGap = children.length > 1 ? gap + freeSpace / (children.length - 1) : gap;
    } else if (justify === 'space-around') {
      const spaceAround = freeSpace / children.length;
      startPos = spaceAround / 2;
      itemGap = gap + spaceAround;
    }

    // 布局子元素
    let currentPos = startPos;
    return resolvedChildren.map(child => {
      const size = child._resolvedSize;

      // 交叉轴对齐
      let crossPos = 0;
      if (align === 'center') {
        crossPos = (containerCross - size[crossAxis]) / 2;
      } else if (align === 'end') {
        crossPos = containerCross - size[crossAxis];
      } else if (align === 'stretch') {
        size[crossAxis] = containerCross;
      }

      const bounds = isRow
        ? { x: currentPos, y: crossPos, width: size.width, height: size.height }
        : { x: crossPos, y: currentPos, width: size.width, height: size.height };

      currentPos += size[mainAxis] + itemGap;

      return {
        id: child.id,
        type: child.type,
        bounds: {
          x: parentBounds.x + bounds.x,
          y: parentBounds.y + bounds.y,
          width: bounds.width,
          height: bounds.height
        },
        style: child.style || {},
        textKey: child.textKey,
        imageKey: child.imageKey,
        action: child.action
      };
    });
  }

  /**
   * 获取元素bounds
   * @param {Object} resolvedLayout - 解析后的布局
   * @param {string} elementId - 元素ID
   * @returns {Object|null} bounds对象
   */
  getBounds(resolvedLayout, elementId) {
    return resolvedLayout.elements[elementId]?.bounds || null;
  }

  /**
   * 检测点是否在元素内
   * @param {Object} bounds - 元素bounds
   * @param {number} x - 点击X坐标
   * @param {number} y - 点击Y坐标
   * @returns {boolean}
   */
  hitTest(bounds, x, y) {
    return bounds &&
           x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
}

module.exports = LayoutEngine;
