const path = require('path');
const Sqlite3DBManager = require('../../common-modules/sqlite3-db-manager');
const utils = require('../../helepers/utils/index.js');
const {getLogger} = require('../../log/index.js');
const log = getLogger('Service');

const getDefaultTables = (dbMgrName) => {
    if (!dbMgrName || dbMgrName ==='sqlite3DBMgr') {
        return {
            site_counter_ips: {
                columns: [
                    { name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY AUTOINCREMENT' },
                    { name: 'logts', type: 'INTEGER' },
                    { name: 'format_date', type: 'TEXT' },
                    { name: 'part_date', type: 'TEXT' },
                    { name: 'site_host', type: 'TEXT' },
                    { name: 'page_pathname', type: 'TEXT' },
                    { name: 'user_agent', type: 'TEXT' },
                    { name: 'ip', type: 'CHAR(20)' },
                    { name: 'ip_location', type: 'TEXT' },
                    { name: 'incr_type', type: 'TEXT' },
                    { name: 'href', type: 'TEXT' }
                ],
                state: 'uninitialized', // uninitialized｜creating|created｜failed
                callbacks: [] // [[resolve, reject], [resolve, reject]]
            }
        }
    }
 
    return new Error(`getDefaultTables: unsupported dbMgrName ${dbMgrName}`);
}

class DBService {
    #sqlite3DBStore = {
        filePath: path.resolve(__dirname, process.env.SQLITE3_DB_FILE_PATH || './db.sqlite3'),
        tables: getDefaultTables('sqlite3DBMgr'),
        instance: null
    }
    #defaultDBMgrName = 'sqlite3DBMgr'

    get #sqlite3DBMgr () {
        if (this.#sqlite3DBStore.instance) return this.#sqlite3DBStore.instance;
        this.#sqlite3DBStore.instance = new Sqlite3DBManager(this.#sqlite3DBStore.filePath);
        return this.#sqlite3DBStore.instance;
    }
    
    get #defaultDBMgr () {
        switch (this.#defaultDBMgrName) {
            case 'sqlite3DBMgr': {
                return this.#sqlite3DBMgr;
            }
        }
       
        return this.#sqlite3DBMgr;
    }
    
    updateSqlite3Config ({
      filePath,
      isClearTables,
      addTables, // { [tableName]: { columns: [{...}], state?: 'created' } }
      delTableNames // [tableName1,tableName2]
    }) {
        filePath && (this.#sqlite3DBStore.filePath = filePath);

        if (isClearTables) {
            for (const tableName of this.#sqlite3DBStore.tables) {
                this.#deleteSqlite3Table(tableName);
            }
        }

        if (delTableNames && delTableNames.length) {
            for (const tableName of delTableNames) {
                this.#deleteSqlite3Table(tableName);
            }
        }

        if (addTables && addTables.length) {
            for (const tableName in addTables) {
                let table = this.#sqlite3DBStore.tables[tableName];
                if (!table) {
                    table = {
                        state: 'uninitialized', // uninitialized｜creating|created｜failed
                        callbacks: [] // [[resolve, reject], [resolve, reject]]
                    };
                    this.#sqlite3DBStore.tables[tableName] = table;
                }
                Object.assign(table, addTables[tableName]);
            }
        }
    }

    async insertSiteCounterIpRecord ({
        site_host,
        page_pathname,
        user_agent,
        ip,
        ip_location,
        incr_type,
        href
    }) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog(
                'debug',  'call insertSiteCounterIpRecord, tableName:', tableName,
                ' ,site_host:', site_host, ' ,page_pathname:', page_pathname,
                ' ,user_agent:', user_agent, ' ,ip:', ip, ' ,ip_location:', ip_location,
                ' ,incr_type:', incr_type, ' ,href:', href
            );
            await this.#createDefaultDBMgrTable(tableName);
            const nowTs = Date.now();
            const record = {
                logts: nowTs,
                format_date: utils.getCurrFormatTs(nowTs),
                part_date: utils.getCurrFormatTs(nowTs, undefined, true),
                site_host,
                user_agent,
                ip,
                incr_type,
                href
            };
            page_pathname && (record.page_pathname = page_pathname);
            ip_location && (record.ip_location = ip_location);
            this.#printlog('debug',  'insertSiteCounterIpRecord insertRecord start ,tableName:', tableName, ' ,record:', record);
            const result = await this.#defaultDBMgr.insertRecord(tableName, record);
            this.#printlog('debug',  'insertSiteCounterIpRecord insertRecord end, tableName:', tableName, ' ,inserted', result);
        } catch (err) {
            this.#printlog('error',  'insertSiteCounterIpRecord catch error, tableName:', tableName, ' ,error:', err);
        }
    }

    async updateSiteCounterIpRecord (id, updateColumns) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call updateSiteCounterIpRecord, tableName:', tableName, ' ,id:', id, ' ,updateColumns:', updateColumns);
            await this.#createDefaultDBMgrTable(tableName);
            this.#printlog('debug',  'updateSiteCounterIpRecord updateRecords start ,tableName:', tableName, ' ,id:', id, ' ,updateColumns:', updateColumns);
            const result = await this.#defaultDBMgr.updateRecords(tableName, updateColumns, `id = ${id}`);
            this.#printlog('debug',  'updateSiteCounterIpRecord updateRecords end, tableName:', tableName, ' ,id:', id, ' ,updated', result);
        } catch (err) {
            this.#printlog('error',  'updateSiteCounterIpRecord catch error, tableName:', tableName, ' ,error:', err, ' ,id:', id, ' ,updateColumns:', updateColumns);
        }
    }

    async updateSiteCounterIpRecords (updateColumns, condition) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call updateSiteCounterIpRecords, tableName:', tableName, ' ,updateColumns:', updateColumns, ' ,condition:', condition);
            await this.#createDefaultDBMgrTable(tableName);
            this.#printlog('debug',  'updateSiteCounterIpRecords updateRecords start ,tableName:', tableName, ' ,updateColumns:', updateColumns, ' ,condition:', condition);
            const result = await this.#defaultDBMgr.updateRecords(tableName, updateColumns, condition);
            this.#printlog('debug',  'updateSiteCounterIpRecords updateRecords end, tableName:', tableName, ' ,updated', result);
        } catch (err) {
            this.#printlog('error',  'updateSiteCounterIpRecords catch error, tableName:', tableName, ' ,error:', err, ' ,updateColumns:', updateColumns, ' ,condition:', condition);
        }
    }
    
    async cleanExpiredSiteCounterIpRecords (expiredDay=31) {
      const tableName ='site_counter_ips';
      try {
        const expiredTs = Date.now() - expiredDay * 24 * 60 * 60 * 1000;
        this.#printlog('info',  'call cleanExpiredSiteCounterIpRecords, tableName:', tableName, ' ,expiredDay:', expiredDay, ' ,expiredTs:', expiredTs);
        await this.#createDefaultDBMgrTable(tableName);
        this.#printlog('info', 'cleanExpiredSiteCounterIpRecords deleteRecords start ,tableName:', tableName, ' ,expiredDay:', expiredDay);
        const result = await this.#defaultDBMgr.deleteRecords(tableName, `logts < ${expiredTs}`);
        this.#printlog('info', 'cleanExpiredSiteCounterIpRecords deleteRecords end, tableName:', tableName, ' ,expiredDay:', expiredDay, ' ,deleted', result);
      } catch (err) {
        this.#printlog('error',  'cleanExpiredSiteCounterIpRecords catch error, tableName:', tableName, ' ,error:', err, ' ,expiredDay:', expiredDay);
      }
    }

    async deleteSiteCounterIpRecord (id) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call deleteSiteCounterIpRecord, tableName:', tableName, ' ,id:', id);
            await this.#createDefaultDBMgrTable(tableName);
            this.#printlog('debug',  'deleteSiteCounterIpRecord deleteRecords start ,tableName:', tableName, ' ,id:', id);
            const result = await this.#defaultDBMgr.deleteRecords(tableName, `id = ${id}`);
            this.#printlog('debug',  'deleteSiteCounterIpRecord deleteRecords end, tableName:', tableName, ' ,id:', id, ' ,deleted', result);
        } catch (err) {
            this.#printlog('error',  'deleteSiteCounterIpRecord catch error, tableName:', tableName, ' ,error:', err, ' ,id:', id);
        }
    }

    async getPaginatedSiteCounterIpRecords ({pageSize=200, pageNo=1, condition, extraFilter}) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call getPaginatedSiteCounterIpRecords, tableName:', tableName, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            await this.#createDefaultDBMgrTable(tableName);
            const result = await this.#defaultDBMgr.getPaginatedRecords(tableName, pageNo, pageSize, condition, undefined, {isGetTotalPages: true, extraFilter});
            this.#printlog('debug',  'getPaginatedSiteCounterIpRecords getPaginatedRecords end, tableName:', tableName, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            return result; // { totalPages, totalCount, pageSize, pageNo, records }
        } catch (err) {
            this.#printlog('error',  'getPaginatedSiteCounterIpRecords catch error, tableName:', tableName, ' ,error:', err, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            throw err;
        }
    }

    async getAllSiteCounterIpRecords ({pageSize=200, condition, extraFilter}) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call getAllSiteCounterIpRecords, tableName:', tableName, ' ,pageSize:', pageSize, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            await this.#createDefaultDBMgrTable(tableName);
            const result = await this.#defaultDBMgr.getAllPaginatedRecords(tableName, pageSize, condition, undefined, {extraFilter});
            this.#printlog('debug',  'getAllSiteCounterIpRecords getAllPaginatedRecords end, tableName:', tableName, ' ,pageSize:', pageSize, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            return result; // records
        } catch (err) {
            this.#printlog('error',  'getAllSiteCounterIpRecords catch error, tableName:', tableName, ' ,error:', err, ' ,pageSize:', pageSize, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            throw err;
        }
    }
    
    async getPaginatedSiteCounterIpsStats ({pageSize=200, pageNo=1, condition, extraFilter}) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call getPaginatedSiteCounterIpsStats, tableName:', tableName, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            await this.#createDefaultDBMgrTable(tableName);
            const ipsStatsSql = `
                WITH RankedIps AS (
                    SELECT part_date, ip, ip_location, COUNT(*) AS count, MAX(logts) AS lastTs, ROW_NUMBER() OVER (PARTITION BY part_date ORDER BY part_date) AS row_num
                    FROM ${tableName}
                    ${condition ? `WHERE ${condition}` : ''}
                    GROUP BY part_date, ip${extraFilter ? ` ${extraFilter}` : ''}
                )
                SELECT part_date, ip, ip_location, count, lastTs
                FROM RankedIps
                WHERE row_num BETWEEN ((${pageNo}-1)*${pageSize}+1) AND ${pageNo}*${pageSize}
            `;
            const partDateCountsSql = `SELECT part_date, COUNT(*) AS part_date_log_count, COUNT(DISTINCT ip) AS part_date_ip_count FROM ${tableName} ${condition ? `WHERE ${condition}` : ''} GROUP BY part_date${extraFilter ? ` ${extraFilter}` : ''}`

            const ipsStatsSqlResult = await this.#defaultDBMgr.all(ipsStatsSql); // [{part_date, ip, ip_location, count, lastTs}]
            const partDateCountsSqlResult = await this.#defaultDBMgr.all(partDateCountsSql); // [{part_date, part_date_log_count, part_date_ip_count}]
            
            const partDateTotalPagesJson = {}; // { [part_date]: [totalPages, totalCount, logCount] }
            for (const {part_date, part_date_log_count, part_date_ip_count} of partDateCountsSqlResult) {
                partDateTotalPagesJson[part_date] = [Math.ceil(part_date_ip_count / pageSize), part_date_ip_count, part_date_log_count];
            }

            const result = {}; // { [part_date]: { totalPages, totalCount, logCount, pageSize, pageNo, ipDatas: { [ip]: [count, ip_location, lastTs] } } }
            for (const {part_date, ip, ip_location, count, lastTs} of ipsStatsSqlResult) {
                if (!partDateTotalPagesJson[part_date]) continue;
                const [totalPages, totalCount, logCount] = partDateTotalPagesJson[part_date];
                !result[part_date] && (result[part_date] = {totalPages, totalCount, logCount, pageSize, pageNo, ipDatas: {}});
                result[part_date].ipDatas[ip] = [count, ip_location, lastTs];
            }

            this.#printlog('debug',  'getPaginatedSiteCounterIpsStats getPaginatedRecords end, tableName:', tableName, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            return result;
        } catch (err) {
            this.#printlog('error',  'getPaginatedSiteCounterIpsStats catch error, tableName:', tableName, ' ,error:', err, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            throw err;
        }
    }

    async getPaginatedSiteCounterIpLogs ({pageSize=200, pageNo=1, condition, extraFilter}) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call getPaginatedSiteCounterIpLogs, tableName:', tableName, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            const { totalPages, totalCount, pageSize: pageSizeTmp, pageNo: pageNoTmp, records } = await this.getPaginatedSiteCounterIpRecords({pageSize, pageNo, condition, extraFilter});
            const logDatas = [];
            records.forEach((record) => {
              const { logts, ip, ip_location, user_agent, href } = record;
              logDatas.push([logts, ip, ip_location, user_agent, href]);
            })
            this.#printlog('debug',  'getPaginatedSiteCounterIpLogs getPaginatedSiteCounterIpRecords end, tableName:', tableName, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            return {totalPages, totalCount, pageSize: pageSizeTmp, pageNo: pageNoTmp, logDatas};
        } catch (err) {
            this.#printlog('error',  'getPaginatedSiteCounterIpLogs catch error, tableName:', tableName, ' ,error:', err, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo, ' ,condition:', condition, ' ,extraFilter:', extraFilter);
            throw err;
        }
    }

    async #createDefaultDBMgrTable(tableName) {
        switch (this.#defaultDBMgrName) {
            case 'sqlite3DBMgr': {
                return this.#createSqlite3Table(tableName);
            }
        }

        return this.#createSqlite3Table(tableName);
    }

    async #createSqlite3Table(tableName) {
        let table;
        try {
            table = this.#sqlite3DBStore.tables[tableName];
            if (!table) throw new Error(`Table ${tableName} not found`);

            if (table.state === 'created')
                return;

            if (table.state === 'creating') {
                return new Promise((resolve, reject) => {
                    table.callbacks.push([resolve, reject]);
                });
            }

            this.#printlog('debug',  'createSqlite3Table tableName:', tableName, ' ,state:', table.state);
            table.state = 'creating';
            const tableExists = await this.#defaultDBMgr.tableExists(tableName);
            if (tableExists) {
                this.#printlog('debug',  'createSqlite3Table tableName:', tableName, ' ,already exists');
            } else {
                if (!table.columns || !table.columns.length) throw new Error(`Table ${tableName} columns not found`);
                this.#printlog('debug',  'createSqlite3Table tableName:', tableName, ' ,creating...');
                const result = await this.#defaultDBMgr.createTable(tableName, table.columns);
                this.#printlog('debug',  'createSqlite3Table tableName:', tableName, ' ,created', result);
            }

            table.state = 'created';
            const promiseCallbacks = table.callbacks;
            table.callbacks = [];
            this.#triggerPromiseCallbacks(promiseCallbacks);
        } catch (error) {
            this.#printlog('error',  'createSqlite3Table tableName:', tableName, ' ,error:', error);
            table.state = 'failed';
            const promiseCallbacks = table.callbacks;
            table.callbacks = [];
            this.#triggerPromiseCallbacks(promiseCallbacks, error);
            throw error;
        }
    }

    #deleteSqlite3Table(tableName) {
        const table = this.#sqlite3DBStore.tables[tableName];
        if (!table) return;

        this.#printlog('debug',  'deleteSqlite3Table tableName:', tableName, ' ,state:', table.state);
        delete this.#sqlite3DBStore.tables[tableName];
        table.state = 'deleted';
        const promiseCallbacks = table.callbacks;
        table.callbacks = [];
        this.#triggerPromiseCallbacks(promiseCallbacks, new Error(`Table ${tableName} deleted`));
    }

    #triggerPromiseCallbacks (promiseCallbacks, error, result) {
        setTimeout(() => {
            for (const [resolveCallback, rejectCallback] of promiseCallbacks) {
                try {
                    if (error) {
                        rejectCallback(error);
                    } else {
                        resolveCallback(result);
                    }
                } catch (error) {
                    this.#printlog('error',  'triggerPromiseCallbacks error:', error);
                }
            }
            promiseCallbacks.length = 0;
        }, 0);
    }

    #printlog (method, ...args) {
        if (!log[method]) {
            log.error(new Error(`Invalid log method: ${method}`), ...args, ' ,DBService');
            return;
        }

        log[method](...args, ' ,DBService');
    }
}


const dbServiceInstance = new DBService();
module.exports = dbServiceInstance;