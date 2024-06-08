const sqlite3 = require('sqlite3').verbose();

class Sqlite3DBManager {
    /**
     * 构造函数，初始化数据库连接
     * @param {string} dbFilePath 数据库文件路径
     */
    constructor(dbFilePath) {
        this.db = new sqlite3.Database(dbFilePath, (err) => {
            if (err) {
                console.error('Database opening error: ', err);
            } else {
                console.log('Database opened successfully.');
            }
        });
    }

    /**
     * 获取数据库连接对象
     * @returns {Database} 数据库连接对象
     */
    getDB() {
        return this.db;
    }

    /**
     * 执行带参数的 SQL 语句
     * @param {string} sql SQL 语句
     * @param {Array} params SQL 参数
     * @returns {Promise} Promise 对象，返回最后插入的行的 ID
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('Error running sql: ' + sql);
                    console.error(err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    /**
     * 查询单条记录
     * @param {string} sql SQL 语句
     * @param {Array} params SQL 参数
     * @returns {Promise} Promise 对象，返回查询结果
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    console.error('Error running sql: ' + sql);
                    console.error(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * 查询多条记录
     * @param {string} sql SQL 语句
     * @param {Array} params SQL 参数
     * @returns {Promise} Promise 对象，返回查询结果
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error running sql: ' + sql);
                    console.error(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * 逐行遍历查询结果
     * @param {string} sql SQL 语句
     * @param {Array} params SQL 参数
     * @param {Function} rowCallback 每行处理回调
     * @returns {Promise} Promise 对象，表示遍历操作完成
     */
    each(sql, params = [], rowCallback) {
        return new Promise((resolve, reject) => {
            this.db.each(sql, params, (err, row) => {
                if (err) {
                    console.error('Error running sql: ' + sql);
                    console.error(err);
                    reject(err);
                } else {
                    rowCallback(row);
                }
            }, (err, count) => {
                if (err) {
                    console.error('Error completing query: ' + sql);
                    console.error(err);
                    reject(err);
                } else {
                    resolve(count);
                }
            });
        });
    }

    /**
     * 顺序执行多个数据库操作
     * @param {Function} callback 回调函数
     */
    serialize(callback) {
        this.db.serialize(callback);
    }

    /**
     * 并行执行多个数据库操作
     * @param {Function} callback 回调函数
     */
    parallelize(callback) {
        this.db.parallelize(callback);
    }

    /**
     * 创建预处理语句
     * @param {string} sql SQL 语句
     * @returns {sqlite3.Statement} 预处理语句对象
     */
    prepare(sql) {
        return this.db.prepare(sql);
    }

    /**
     * 关闭数据库连接
     * @returns {Promise} Promise 对象，表示关闭操作完成
     */
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database: ', err);
                    reject(err);
                } else {
                    console.log('Database connection closed.');
                    resolve();
                }
            });
        });
    }

    /**
     * 检测表是否存在
     * @param {string} tableName 表名
     * @returns {Promise<boolean>} Promise 对象，返回表是否存在的布尔值
     */
    async tableExists(tableName) {
        const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
        const result = await this.get(sql, [tableName]);
        return !!result;
    }

    /**
     * 创建表
     * @param {string} tableName 表名
     * @param {Array} columns 列定义
     * @returns {Promise} Promise 对象，表示创建操作完成
     */
    createTable(tableName, columns) {
        const columnsStr = columns.map(col => `${col.name} ${col.type}${col.extra ? ' ' + col.extra : ''}`).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsStr})`;
        return this.run(sql);
    }

    /**
     * 插入记录
     * @param {string} tableName 表名
     * @param {Object} record 记录对象
     * @returns {Promise} Promise 对象，表示插入操作完成
     */
    insertRecord(tableName, record) {
        const keys = Object.keys(record);
        const values = Object.values(record);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
        return this.run(sql, values);
    }

    /**
     * 删除记录
     * @param {string} tableName 表名
     * @param {string} condition 删除条件
     * @returns {Promise} Promise 对象，表示删除操作完成
     */
    deleteRecord(tableName, condition) {
        const sql = `DELETE FROM ${tableName} WHERE ${condition}`;
        return this.run(sql);
    }

    /**
     * 更新记录
     * @param {string} tableName 表名
     * @param {Object} record 更新内容
     * @param {string} condition 更新条件
     * @returns {Promise} Promise 对象，表示更新操作完成
     */
    updateRecord(tableName, record, condition) {
        const keys = Object.keys(record);
        const values = Object.values(record);
        const sets = keys.map(key => `${key} = ?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${sets} WHERE ${condition}`;
        return this.run(sql, values);
    }

    /**
     * 查询记录
     * @param {string} tableName 表名
     * @param {string} [condition=''] 查询条件
     * @param {Array} [params=[]] 查询参数
     * @param {Object} [opts={}] 配置项
     *  - [opts.columnKeys] {Array} 要查询的字段名数组，为空则查询所有字段
     * @returns {Promise} Promise 对象，返回查询结果
     */
    getRecords(tableName, condition = '', params = [], opts = {}) {
        const sql = `SELECT ${opts.columnKeys ? opts.columnKeys.join(', ') : '*'} FROM ${tableName} ${condition ? 'WHERE ' + condition : ''}`;
        return this.all(sql, params);
    }

    /**
     * 获取单条记录
     * @param {string} tableName 表名
     * @param {string} condition 查询条件
     * @param {Array} [params=[]] 查询参数
     * @param {Object} [opts={}] 配置项
     *  - [opts.columnKeys] {Array} 要查询的字段名数组，为空则查询所有字段
     * @returns {Promise} Promise 对象，返回查询结果
     */
    getRecord(tableName, condition, params = [], opts = {}) {
        const sql = `SELECT ${opts.columnKeys ? opts.columnKeys.join(', ') : '*'} FROM ${tableName} WHERE ${condition}`;
        return this.get(sql, params);
    }

    /**
     * 获取指定 ID 的记录
     * @param {string} tableName 表名
     * @param {number} id 记录 ID
     * @param {Object} [opts={}] 配置项
     *  - [opts.columnKeys] {Array} 要查询的字段名数组，为空则查询所有字段
     * @returns {Promise} Promise 对象，返回查询结果
     */
    getRecordById(tableName, id, opts={}) {
        const sql = `SELECT ${opts.columnKeys ? opts.columnKeys.join(', ') : '*'} FROM ${tableName} WHERE id = ?`;
        return this.get(sql, [id]);
    }

    /**
     * 获取指定字段值的记录
     * @param {string} tableName 表名
     * @param {string} field 字段名
     * @param {string} value 字段值
     * @param {Object} [opts={}] 配置项
     *  - [opts.columnKeys] {Array} 要查询的字段名数组，为空则查询所有字段
     * @returns {Promise} Promise 对象，返回查询结果
     */
    getRecordByField(tableName, field, value, opts={}) {
        const sql = `SELECT ${opts.columnKeys ? opts.columnKeys.join(', ') : '*'} FROM ${tableName} WHERE ${field} = ?`;
        return this.get(sql, [value]);
    }

    /**
     * 获取记录总数
     * @param {string} tableName 表名
     * @param {string} [condition=''] 查询条件
     * @param {Array} [params=[]] 查询参数
     * @returns {Promise} Promise 对象，返回记录总数
     */
    getRecordCount(tableName, condition = '', params = []) {
        const sql = `SELECT COUNT(*) as count FROM ${tableName} ${condition ? 'WHERE ' + condition : ''}`;
        return this.get(sql, params);
    }

    /**
     * 获取分页记录
     * @param {string} tableName 表名
     * @param {number} page 页码
     * @param {number} pageSize 每页记录数
     * @param {string} [condition=''] 查询条件
     * @param {Array} [params=[]] 查询参数
     * @param {Object} [opts={}] 配置项
     *  - [opts.columnKeys] {Array} 要查询的字段名数组，为空则查询所有字段
     *  - [opts.extra] {string} 额外查询条件，如：'ORDER BY id DESC'
     *  - [opts.isGetTotalPages] {boolean} 是否获取总页数，默认 false
     * @returns {Promise} Promise 对象，返回分页查询结果
     */
    async getPaginatedRecords(tableName, page, pageSize, condition = '', params = [], opts={}) {
        const offset = (page - 1) * pageSize;
        const sql = `SELECT ${opts.columnKeys ? opts.columnKeys.join(', ') : '*'} FROM ${tableName} ${condition ? 'WHERE ' + condition : ''}${opts.extra ? ' '+opts.extra : ''} LIMIT ${pageSize} OFFSET ${offset}`;
        
        if (opts.isGetTotalPages) {
            const records = await this.all(sql, params);
            const totalCount = await this.getRecordCount(tableName, condition, params);
            const totalPages = Math.ceil(totalCount.count / pageSize);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return { records, pageSize, page, totalPages, hasNextPage, hasPrevPage };
        }

        return this.all(sql, params);
    }

    /**
     * 获取所有记录，分页获取
     * @param {string} tableName 表名
     * @param {number} pageSize 每页记录数
     * @param {string} [condition=''] 查询条件
     * @param {Array} [params=[]] 查询参数
     * @param {Object} [opts={}] 配置项
     *  - [opts.responsePage] {boolean} 是否返回每页记录，默认 false
     * @returns {Promise} Promise 对象，返回所有记录
     */
    async getAllPaginatedRecords(tableName, pageSize, condition = '', params = [], opts={}) {
        const totalCount = await this.getRecordCount(tableName, condition, params);
        const totalPages = Math.ceil(totalCount.count / pageSize);
        const records = [];
        for (let page = 1; page <= totalPages; page++) {
            try {
                const pageRecords = await this.getPaginatedRecords(tableName, page, pageSize, condition, params);
                opts.responsePage ? records.push(pageRecords) : records.push(...pageRecords);
            } catch (err) {
                opts.responsePage && records.push(null);
                console.error('getAllPaginatedRecords page error:', err, ' ,page:', page, tableName, pageSize, condition, params, opts);
            }
        }
        return records;
    }
}

module.exports = Sqlite3DBManager;
