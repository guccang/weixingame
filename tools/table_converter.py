# -*- coding: utf-8 -*-
"""
表格转换工具 - 生成表格数据结构和初始数据
生成的文件：
  1. tableConfig.js - 表格元数据配置
  2. tableStruct.js - 数据结构类定义
  3. tableData.js - 初始数据（用于首次启动复制到用户目录）
  4. tableManager.js - 表格管理器（自动复制+加载）
"""

import os
from datetime import datetime

# 配置
TABLES_DIR = os.path.join(os.path.dirname(__file__), '..', 'jump-tower-game', 'tables')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'jump-tower-game', 'js', 'tables')

# 类型映射
TYPE_MAP = {
    'INT': {'js_type': 'number', 'default': '0'},
    'STRING': {'js_type': 'string', 'default': "''"},
    'FLOAT': {'js_type': 'number', 'default': '0'},
    'BOOL': {'js_type': 'boolean', 'default': 'false'},
    'ENUM': {'js_type': 'string', 'default': "''"},
}


def parse_table_file(filepath):
    """解析表格文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    if len(lines) < 4:
        return None

    types = lines[0].strip().split('\t')
    comments = [item.lstrip('#') for item in lines[1].strip().split('\t')]
    fields = [item.lstrip('#') for item in lines[2].strip().split('\t')]

    rows = []
    for i in range(3, len(lines)):
        line = lines[i].strip()
        if not line:
            continue
        values = line.split('\t')
        row = {}
        for j, field in enumerate(fields):
            value = values[j] if j < len(values) else ''
            field_type = types[j] if j < len(types) else 'STRING'
            row[field] = convert_value(value, field_type)
        rows.append(row)

    return {
        'types': types,
        'comments': comments,
        'fields': fields,
        'rows': rows
    }


def convert_value(value, field_type):
    """类型转换"""
    if field_type == 'INT':
        try:
            return int(value)
        except:
            return 0
    elif field_type == 'FLOAT':
        try:
            return float(value)
        except:
            return 0.0
    elif field_type == 'BOOL':
        return value.lower() in ('true', '1', 'yes')
    else:
        return value


def get_js_value(value, field_type):
    """生成 JS 值表示"""
    if field_type == 'INT' or field_type == 'FLOAT':
        return str(value)
    elif field_type == 'BOOL':
        return 'true' if value else 'false'
    else:
        escaped = str(value).replace('\\', '\\\\').replace("'", "\\'")
        return f"'{escaped}'"


def generate_table_config(tables_info):
    """生成表格配置文件"""
    lines = [
        '/**',
        ' * 表格配置 - 自动生成',
        f' * 生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
        ' */',
        '',
        'const FieldType = {',
        "  INT: 'INT',",
        "  STRING: 'STRING',",
        "  FLOAT: 'FLOAT',",
        "  BOOL: 'BOOL',",
        '};',
        '',
    ]

    for table_name, info in tables_info.items():
        fields = info['fields']
        types = info['types']
        comments = info['comments']

        lines.append(f'const {table_name}Config = ' + '{')
        lines.append(f"  name: '{table_name}',")
        lines.append(f"  file: '{table_name}.txt',")
        lines.append('  fields: [')

        for i, field in enumerate(fields):
            field_type = types[i] if i < len(types) else 'STRING'
            comment = comments[i] if i < len(comments) else ''
            lines.append(f"    {{ name: '{field}', type: '{field_type}', comment: '{comment}' }},")

        lines.append('  ],')
        lines.append('};')
        lines.append('')

    lines.append('const TableConfigs = {')
    for table_name in tables_info.keys():
        lines.append(f'  {table_name}: {table_name}Config,')
    lines.append('};')
    lines.append('')

    lines.append('module.exports = { FieldType, TableConfigs };')

    return '\n'.join(lines)


def generate_table_struct(tables_info):
    """生成数据结构定义"""
    lines = [
        '/**',
        ' * 表格数据结构定义 - 自动生成',
        f' * 生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
        ' */',
        '',
        "const { FieldType } = require('./tableConfig');",
        '',
        '/**',
        ' * 表格行基类',
        ' */',
        'class BaseTableRow {',
        '  constructor() { this._id = 0; }',
        '  get id() { return this._id; }',
        '',
        '  initFromObject(obj, fields, types) {',
        '    for (let i = 0; i < fields.length; i++) {',
        '      const field = fields[i];',
        '      const type = types[i] || "STRING";',
        '      this[field] = this._parseValue(obj[field], type);',
        '    }',
        '    if (this[fields[0]] !== undefined) {',
        '      this._id = this[fields[0]];',
        '    }',
        '  }',
        '',
        '  _parseValue(value, type) {',
        '    switch (type) {',
        '      case FieldType.INT: return parseInt(value) || 0;',
        '      case FieldType.FLOAT: return parseFloat(value) || 0;',
        '      case FieldType.BOOL: return value === true || value === "true" || value === "1";',
        '      default: return String(value || "");',
        '    }',
        '  }',
        '}',
        '',
    ]

    for table_name, info in tables_info.items():
        fields = info['fields']
        types = info['types']
        comments = info['comments']

        lines.append('/**')
        lines.append(f' * {table_name} 表数据行')
        for i, field in enumerate(fields):
            js_type = TYPE_MAP.get(types[i], TYPE_MAP['STRING'])['js_type'] if i < len(types) else 'string'
            comment = comments[i] if i < len(comments) else ''
            lines.append(f' * @property {{{js_type}}} {field} - {comment}')
        lines.append(' */')
        lines.append(f'class {table_name}Row extends BaseTableRow ' + '{')
        lines.append('  constructor() {')
        lines.append('    super();')
        for i, field in enumerate(fields):
            default = TYPE_MAP.get(types[i], TYPE_MAP['STRING'])['default'] if i < len(types) else "''"
            lines.append(f'    this.{field} = {default};')
        lines.append('  }')
        lines.append('')
        lines.append('  static create(obj, fields, types) {')
        lines.append(f'    const row = new {table_name}Row();')
        lines.append('    row.initFromObject(obj, fields, types);')
        lines.append('    return row;')
        lines.append('  }')
        lines.append('}')
        lines.append('')

    lines.append('module.exports = {')
    lines.append('  BaseTableRow,')
    for table_name in tables_info.keys():
        lines.append(f'  {table_name}Row,')
    lines.append('};')

    return '\n'.join(lines)


def generate_table_data(tables_info):
    """生成初始数据文件"""
    lines = [
        '/**',
        ' * 表格初始数据 - 自动生成',
        ' * 首次启动时会复制到用户目录',
        f' * 生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
        ' */',
        '',
    ]

    for table_name, info in tables_info.items():
        fields = info['fields']
        types = info['types']
        rows = info['rows']

        lines.append(f'const {table_name}Data = [')
        for row in rows:
            row_parts = []
            for i, field in enumerate(fields):
                field_type = types[i] if i < len(types) else 'STRING'
                value = row.get(field, '')
                js_value = get_js_value(value, field_type)
                row_parts.append(f'{field}: {js_value}')
            lines.append('  {' + ', '.join(row_parts) + '},')
        lines.append('];')
        lines.append('')

    lines.append('module.exports = {')
    for table_name in tables_info.keys():
        lines.append(f'  {table_name}Data,')
    lines.append('};')

    return '\n'.join(lines)


def generate_table_manager(tables_info):
    """生成表格管理器"""
    lines = [
        '/**',
        ' * 表格数据管理器',
        ' * 首次启动时将数据复制到用户目录，之后从用户目录加载',
        ' */',
        '',
        "const { TableConfigs } = require('./tableConfig');",
        "const initialData = require('./tableData');",
        '',
    ]

    # 引入行类
    for table_name in tables_info.keys():
        lines.append(f"const {{ {table_name}Row }} = require('./tableStruct');")
    lines.append('')

    lines.extend([
        'class TableManager {',
        '  constructor() {',
        '    this.tables = {};',
        '    this.maps = {};',
        '    this.initialized = false;',
        '    this.userDataPath = wx.env.USER_DATA_PATH;',
        '    this.tableDir = this.userDataPath + "/game_tables";',
        '  }',
        '',
        '  /**',
        '   * 初始化：确保用户目录有数据，然后加载',
        '   */',
        '  init() {',
        '    if (this.initialized) return;',
        '',
        '    // 确保表格目录存在',
        '    this._ensureTableDir();',
        '',
        '    // 检查并复制初始数据',
        '    this._checkAndCopyData();',
        '',
        '    // 加载所有表格',
        '    for (const tableName in TableConfigs) {',
        '      this._loadTable(tableName);',
        '    }',
        '',
        '    this.initialized = true;',
        '    console.log("[TableManager] 初始化完成:", Object.keys(this.tables));',
        '  }',
        '',
        '  /**',
        '   * 确保表格目录存在',
        '   */',
        '  _ensureTableDir() {',
        '    const fs = wx.getFileSystemManager();',
        '    try {',
        '      fs.accessSync(this.tableDir);',
        '    } catch (e) {',
        '      fs.mkdirSync(this.tableDir, true);',
        '      console.log("[TableManager] 创建表格目录:", this.tableDir);',
        '    }',
        '  }',
        '',
        '  /**',
        '   * 检查并复制初始数据到用户目录',
        '   */',
        '  _checkAndCopyData() {',
        '    const fs = wx.getFileSystemManager();',
        '    const versionFile = this.tableDir + "/.version";',
        '    const currentVersion = "' + datetime.now().strftime("%Y%m%d%H%M%S") + '";',
        '',
        '    let needCopy = false;',
        '    try {',
        '      const savedVersion = fs.readFileSync(versionFile, "utf-8");',
        '      if (savedVersion !== currentVersion) {',
        '        needCopy = true;',
        '      }',
        '    } catch (e) {',
        '      needCopy = true;',
        '    }',
        '',
        '    if (needCopy) {',
        '      console.log("[TableManager] 复制初始数据到用户目录...");',
        '      for (const tableName in TableConfigs) {',
        '        const config = TableConfigs[tableName];',
        '        const filePath = this.tableDir + "/" + config.file;',
        '        const data = initialData[tableName + "Data"];',
        '        fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");',
        '        console.log("[TableManager] 写入:", filePath);',
        '      }',
        '      fs.writeFileSync(versionFile, currentVersion, "utf-8");',
        '      console.log("[TableManager] 数据复制完成");',
        '    }',
        '  }',
        '',
        '  /**',
        '   * 从用户目录加载表格',
        '   */',
        '  _loadTable(tableName) {',
        '    const config = TableConfigs[tableName];',
        '    const filePath = this.tableDir + "/" + config.file;',
        '    const RowClass = this._getRowClass(tableName);',
        '',
        '    try {',
        '      const fs = wx.getFileSystemManager();',
        '      const content = fs.readFileSync(filePath, "utf-8");',
        '      const dataArray = JSON.parse(content);',
        '',
        '      const fields = config.fields.map(f => f.name);',
        '      const types = config.fields.map(f => f.type);',
        '',
        '      const rows = dataArray.map(obj => RowClass.create(obj, fields, types));',
        '      this.tables[tableName] = rows;',
        '      this.maps[tableName] = this._buildMap(rows);',
        '',
        '      console.log(`[TableManager] 加载 ${tableName}: ${rows.length} 行`);',
        '    } catch (e) {',
        '      console.error(`[TableManager] 加载失败 ${tableName}:`, e);',
        '      this.tables[tableName] = [];',
        '      this.maps[tableName] = {};',
        '    }',
        '  }',
        '',
        '  _getRowClass(tableName) {',
        '    const classMap = {',
    ])

    for table_name in tables_info.keys():
        lines.append(f'      {table_name}: {table_name}Row,')
    lines.append('    };')
    lines.append('    return classMap[tableName];')
    lines.append('  }')
    lines.append('')

    lines.extend([
        '  _buildMap(rows) {',
        '    const map = {};',
        '    for (const row of rows) {',
        '      map[row.id] = row;',
        '    }',
        '    return map;',
        '  }',
        '',
        '  // ==================== 查询接口 ====================',
        '',
        '  getAll(tableName) {',
        '    this._checkInit();',
        '    return this.tables[tableName] || [];',
        '  }',
        '',
        '  getById(tableName, id) {',
        '    this._checkInit();',
        '    return this.maps[tableName] ? this.maps[tableName][id] : null;',
        '  }',
        '',
        '  find(tableName, predicate) {',
        '    return this.getAll(tableName).filter(predicate);',
        '  }',
        '',
        '  findOne(tableName, predicate) {',
        '    return this.getAll(tableName).find(predicate) || null;',
        '  }',
        '',
        '  _checkInit() {',
        '    if (!this.initialized) this.init();',
        '  }',
        '}',
        '',
        '// 单例',
        'const tableManager = new TableManager();',
        '',
        'module.exports = {',
        '  tableManager,',
        '  getAll: (name) => tableManager.getAll(name),',
        '  getById: (name, id) => tableManager.getById(name, id),',
        '  find: (name, fn) => tableManager.find(name, fn),',
        '  findOne: (name, fn) => tableManager.findOne(name, fn),',
        '};',
    ])

    return '\n'.join(lines)


def main():
    print('=' * 50)
    print('表格转换工具')
    print('=' * 50)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    tables_info = {}
    for filename in os.listdir(TABLES_DIR):
        if filename.endswith('.txt'):
            filepath = os.path.join(TABLES_DIR, filename)
            table_name = os.path.splitext(filename)[0]

            print(f'解析: {filename}')
            info = parse_table_file(filepath)
            if info:
                tables_info[table_name] = info
                print(f'  字段: {info["fields"]}')
                print(f'  数据: {len(info["rows"])} 行')

    if not tables_info:
        print('未找到表格文件')
        return

    # 生成文件
    with open(os.path.join(OUTPUT_DIR, 'tableConfig.js'), 'w', encoding='utf-8') as f:
        f.write(generate_table_config(tables_info))
    print('\n生成: tableConfig.js')

    with open(os.path.join(OUTPUT_DIR, 'tableStruct.js'), 'w', encoding='utf-8') as f:
        f.write(generate_table_struct(tables_info))
    print('生成: tableStruct.js')

    with open(os.path.join(OUTPUT_DIR, 'tableData.js'), 'w', encoding='utf-8') as f:
        f.write(generate_table_data(tables_info))
    print('生成: tableData.js')

    with open(os.path.join(OUTPUT_DIR, 'tableManager.js'), 'w', encoding='utf-8') as f:
        f.write(generate_table_manager(tables_info))
    print('生成: tableManager.js')

    print(f'\n完成! 共 {len(tables_info)} 个表格')
    print('=' * 50)


if __name__ == '__main__':
    main()
