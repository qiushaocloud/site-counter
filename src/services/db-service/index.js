const path = require('path');
const Sqlite3DBManager = require('../../common-modules/sqlite3-db-manager');
const utils = require('../../helepers/utils/index.js');
const {getLogger} = require('../../log/index.js');
const log = getLogger('Service');

class DBService {
    #sl3DBStore = {
        filePath: path.resolve(__dirname, process.env.SQLITE3_DB_FILE_PATH || './db.sqlite3'),
        tables: [
            {
                name: 'site_counter_ips',
                columns: [
                    { name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY AUTOINCREMENT' },
                    { name: 'logts', type: 'INTEGER' },
                    { name: 'format_date', type: 'TEXT' },
                    { name: 'part_date', type: 'TEXT' },
                    { name: 'site_host', type: 'TEXT' },
                    { name: 'page_pathname', type: 'TEXT' },
                    { name: 'user_agent', type: 'TEXT' },
                    { name: 'ipv4', type: 'CHAR(20)' },
                    { name: 'ip_location', type: 'TEXT' },
                    { name: 'incr_type', type: 'TEXT' },
                    { name: 'href', type: 'TEXT' }
                ],
                state: 'uninitialized', // uninitialized｜creating|created｜failed
                callbacks: [] // [[resolve, reject], [resolve, reject]]
            }
        ],
        instance: null
    }
    
    get #sl3DBMgr () {
        if (this.#sl3DBStore.instance) return this.#sl3DBStore.instance;
        this.#sl3DBStore.instance = new Sqlite3DBManager(this.#sl3DBStore.filePath);
        return this.#sl3DBStore.instance;
    }
    
    updateSqlite3Config ({
      filePath,
      isClearTables,
      addTables, // { [tableName]: { columns: [{...}] } }
      delTableNames // [tableName1,tableName2]
    }) {
      filePath && (this.#sl3DBStore.filePath = filePath);
      isClearTables && this.#
    }

    async insertSiteCounterIpRecord ({
        site_host,
        page_pathname,
        user_agent,
        ipv4,
        ip_location,
        incr_type,
        href
    }) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog(
                'debug',  'call insertSiteCounterIpRecord, tableName:', tableName,
                ' ,site_host:', site_host, ' ,page_pathname:', page_pathname,
                ' ,user_agent:', user_agent, ' ,ipv4:', ipv4, ' ,ip_location:', ip_location,
                ' ,incr_type:', incr_type, ' ,href:', href
            );
            await this.#createSl3Table(tableName);
            const nowTs = Date.now();
            const record = {
                logts: nowTs,
                format_date: utils.getCurrFormatTs(nowTs),
                part_date: utils.getCurrFormatTs(nowTs, undefined, true),
                site_host,
                user_agent,
                ipv4,
                incr_type,
                href
            };
            page_pathname && (record.page_pathname = page_pathname);
            ip_location && (record.ip_location = ip_location);
            this.#printlog('debug',  'insertSiteCounterIpRecord insertRecord start ,tableName:', tableName, ' ,record:', record);
            const result = await this.#sl3DBMgr.insertRecord(tableName, record);
            this.#printlog('debug',  'insertSiteCounterIpRecord insertRecord end, tableName:', tableName, ' ,inserted', result);
        } catch (err) {
            this.#printlog('error',  'insertSiteCounterIpRecord catch error, tableName:', tableName, ' ,error:', err);
        }
    }

    async updateSiteCounterIpRecord (id, updateColumns) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call updateSiteCounterIpRecord, tableName:', tableName, ' ,id:', id, ' ,updateColumns:', updateColumns);
            await this.#createSl3Table(tableName);
            this.#printlog('debug',  'updateSiteCounterIpRecord updateRecord start ,tableName:', tableName, ' ,id:', id, ' ,updateColumns:', updateColumns);
            const result = await this.#sl3DBMgr.updateRecords(tableName, updateColumns, `id = ${id}`);
            this.#printlog('debug',  'updateSiteCounterIpRecord updateRecord end, tableName:', tableName, ' ,id:', id, ' ,updated', result);
        } catch (err) {
            this.#printlog('error',  'updateSiteCounterIpRecord catch error, tableName:', tableName, ' ,error:', err, ' ,id:', id, ' ,updateColumns:', updateColumns);
        }
    }
    
    async cleanExpiredSiteCounterIpRecords (expiredDay=31) {
      const tableName ='site_counter_ips';
      try {
        const expiredTs = Date.now() - expiredDay * 24 * 60 * 60 * 1000;
        this.#printlog('info',  'call cleanExpiredSiteCounterIpRecords, tableName:', tableName, ' ,expiredDay:', expiredDay, ' ,expiredTs:', expiredTs);
        await this.#createSl3Table(tableName);
        this.#printlog('info', 'cleanExpiredSiteCounterIpRecords deleteRecord start ,tableName:', tableName, ' ,expiredDay:', expiredDay);
        const result = await this.#sl3DBMgr.deleteRecords(tableName, `logts < ${expiredTs}`);
        this.#printlog('info', 'cleanExpiredSiteCounterIpRecords deleteRecord end, tableName:', tableName, ' ,expiredDay:', expiredDay, ' ,deleted', result);
      } catch (err) {
        this.#printlog('error',  'cleanExpiredSiteCounterIpRecords catch error, tableName:', tableName, ' ,error:', err, ' ,expiredDay:', expiredDay);
      }
    }

    async deleteSiteCounterIpRecord (id) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call deleteSiteCounterIpRecord, tableName:', tableName, ' ,id:', id);
            await this.#createSl3Table(tableName);
            this.#printlog('debug',  'deleteSiteCounterIpRecord deleteRecord start ,tableName:', tableName, ' ,id:', id);
            const result = await this.#sl3DBMgr.deleteRecords(tableName, `id = ${id}`);
            this.#printlog('debug',  'deleteSiteCounterIpRecord deleteRecord end, tableName:', tableName, ' ,id:', id, ' ,deleted', result);
        } catch (err) {
            this.#printlog('error',  'deleteSiteCounterIpRecord catch error, tableName:', tableName, ' ,error:', err, ' ,id:', id);
        }
    }

    async getPaginatedSiteCounterIpRecords ({pageSize=200, page=1, condition}) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call getPaginatedSiteCounterIpRecords, tableName:', tableName, ' ,pageSize:', pageSize, ' ,page:', page, ' ,condition:', condition);
            await this.#createSl3Table(tableName);
            const result = await this.#sl3DBMgr.getPaginatedRecords(tableName, page, pageSize, condition, undefined, {isGetTotalPages: true});
            this.#printlog('debug',  'getPaginatedSiteCounterIpRecords getPaginatedRecords end, tableName:', tableName, ' ,pageSize:', pageSize, ' ,page:', page, ' ,condition:', condition, ' ,result:', result);
            return result;
        } catch (err) {
            this.#printlog('error',  'getPaginatedSiteCounterIpRecords catch error, tableName:', tableName, ' ,error:', err, ' ,pageSize:', pageSize, ' ,page:', page, ' ,condition:', condition);
            throw err;
        }
    }

    async getAllSiteCounterIpRecords ({pageSize=200, condition}) {
        const tableName ='site_counter_ips';
        try {
            this.#printlog('debug',  'call getAllSiteCounterIpRecords, tableName:', tableName, ' ,pageSize:', pageSize, ' ,condition:', condition);
            await this.#createSl3Table(tableName);
            const result = await this.#sl3DBMgr.getAllPaginatedRecords(tableName, pageSize, condition);
            this.#printlog('debug',  'getAllSiteCounterIpRecords getAllPaginatedRecords end, tableName:', tableName, ' ,pageSize:', pageSize, ' ,condition:', condition, ' ,result:', result);
            return result;
        } catch (err) {
            this.#printlog('error',  'getAllSiteCounterIpRecords catch error, tableName:', tableName, ' ,error:', err, ' ,pageSize:', pageSize, ' ,condition:', condition);
            throw err;
        }
    }
    
    async getSiteCounterIpsStats ({condition}) {
      // {site_ips: {{[logDay]:{[ip]:[count,ipLocation,lastTs]}}}, page_ips: {[logDay]:{[ip]:[count,ipLocation,lastTs]}}}
      const tableName = 'site_counter_ips';
      try {
        const sql = `SELECT logDay, ipv4, count, lastTs FROM ${tableName}`
      } catch (err) {
        this.#printlog('error', 'getSiteCounterIpsStats catch error, tableName:', tableName, ' ,error:', err, ' ,pageSize:', pageSize, ' ,condition:', condition);
        throw err;
      }
    }

    async #createSl3Table(tableName) {
        let table;
        try {
            table = this.#sl3DBStore.tables.find(t => t.name === tableName);
            if (!table) throw new Error(`Table ${tableName} not found`);

            if (table.state === 'created')
                return;

            if (table.state === 'creating') {
                return new Promise((resolve, reject) => {
                    table.callbacks.push([resolve, reject]);
                });
            }

            this.#printlog('debug',  'createSl3Table tableName:', tableName, ' ,state:', table.state);
            table.state = 'creating';
            const tableExists = await this.#sl3DBMgr.tableExists(tableName);
            if (tableExists) {
                this.#printlog('debug',  'createSl3Table tableName:', tableName, ' ,already exists');
            } else {
                this.#printlog('debug',  'createSl3Table tableName:', tableName, ' ,creating...');
                const result = await this.#sl3DBMgr.createTable(tableName, table.columns);
                this.#printlog('debug',  'createSl3Table tableName:', tableName, ' ,created', result);
            }

            table.state = 'created';
            const promiseCallbacks = table.callbacks;
            table.callbacks = [];
            this.#triggerPromiseCallbacks(promiseCallbacks);
        } catch (error) {
            this.#printlog('error',  'createSl3Table tableName:', tableName, ' ,error:', error);
            table.state = 'failed';
            const promiseCallbacks = table.callbacks;
            table.callbacks = [];
            this.#triggerPromiseCallbacks(promiseCallbacks, error);
            throw error;
        }
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