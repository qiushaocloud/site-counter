const sqlite3 = require('sqlite3').verbose();

class Sqlite3DBManager {
   // 构造函数，初始化数据库连接
   constructor(dbFilePath) {
        // 创建 SQLite 数据库连接
        this.db = new sqlite3.Database(dbFilePath, (err) => {
            if (err) {
                console.error('Database opening error: ', err);
            } else {
                console.log('Database opened successfully.');
            }
        });
    }

    // 执行带参数的 SQL 语句
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('Error running sql ' + sql);
                    console.error(err);
                    reject(err);
                } else {
                    // 解析后的 Promise 返回最后插入的行的 ID
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // 查询单条记录
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

    // 查询多条记录
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

    // 关闭数据库连接
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // 创建表
    createTable(tableName, columns) {
        const columnsStr = columns.map(col => `${col.name} ${col.type}`).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsStr})`;
        return this.run(sql);
    }

    // 插入记录
    insertRecord(tableName, record) {
        const keys = Object.keys(record);
        const values = Object.values(record);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
        return this.run(sql, values);
    }

    // 删除记录
    deleteRecord(tableName, condition) {
        const sql = `DELETE FROM ${tableName} WHERE ${condition}`;
        return this.run(sql);
    }

    // 更新记录
    updateRecord(tableName, record, condition) {
        const keys = Object.keys(record);
        const values = Object.values(record);
        const sets = keys.map(key => `${key} = ?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${sets} WHERE ${condition}`;
        return this.run(sql, values);
    }

    // 查询记录
    getRecords(tableName, condition = '', params = []) {
        const sql = `SELECT * FROM ${tableName} ${condition ? 'WHERE ' + condition : ''}`;
        return this.all(sql, params);
    }

    // 检测表是否存在
    async tableExists(tableName) {
        const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
        const result = await this.get(sql);
        return !!result;
    }
}

module.exports = Sqlite3DBManager;
