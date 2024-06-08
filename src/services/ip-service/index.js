const path = require('path');
const axios = require('axios');
const {getLogger} = require('../../log/index.js');
const defaultConfig = require('./config.js');
const log = getLogger('Service');

const getJsonValueByKey = (json, key, searchIp) => {
    try {
        if (!key) return undefined;
        if (typeof json !== 'object') return undefined;

        const keys = key.split('.');
        let value = json;

        for (const k of keys) {
            if (typeof value !== 'object') return undefined;
            if (!k) continue;
            
            if (k === '[searchIp]') {
                value = value[searchIp] || value[Object.keys(value)[0]];
                continue;
            }

            /^\[\d+\]$/.test(k) && Array.isArray(value) && (k = k.replace(/^\[|\]$/g, ''));
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
                continue;
            }

            return undefined;
        }

        return value;
    } catch (err) {
        log.error('getJsonValueByKey catch error:', err, key, json, searchIp);
        return undefined;
    }
}

const deepAssign = (target, source) => {
    for (const key in source) {
        if (typeof source[key] === 'object' && typeof target[key] === 'object') {
            deepAssign(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }

    return target;
}

const getPromiseCallback = (resolve, reject) => {
    return (err, res) => {
		if (err) return reject && reject(err);
        resolve && resolve(res);
    }
}

const checkEffectiveAddressInfo = (addressInfo) => {
    const { location, area_code, province, city, district, isp } = addressInfo;
    return !!(location || area_code || province || city || district || isp);
}

const DEFAULT_USE_API_URL = process.env.DEFAULT_IP_SERVICE_URL || defaultConfig.defaultUseApiUrl || 'USE_LOCAL_IP2REGION';
const DEFAULT_IP2REGION_MODE = process.env.DEFAULT_IP2REGION_MODE && !isNaN(Number(process.env.DEFAULT_IP2REGION_MODE)) ? Number(process.env.DEFAULT_IP2REGION_MODE) : defaultConfig.defaultIp2Region.mode;
const DEFAULT_IP2REGION_DB_PATH = path.resolve(__dirname, process.env.DEFAULT_IP2REGION_DB_PATH || defaultConfig.defaultIp2Region.dbPath);
const DEFAULT_IP2REGION_BINDING_PATH = path.resolve(__dirname, process.env.DEFAULT_IP2REGION_BINDING_PATH || defaultConfig.defaultIp2Region.bindingPath);

let defaultPartApiConfigMap = defaultConfig.partApiConfigMap;
if (process.env.PART_API_CONFIG_MAP_BASE64_STR) { // 环境变量存在 partApiConfigMap base64 字符串
    try {
        // PART_API_CONFIG_MAP_BASE64_STR 解析base64字符串
        const partApiConfigMapFromEnv = JSON.parse(Buffer.from(process.env.PART_API_CONFIG_MAP_BASE64_STR, 'base64').toString('utf8'));
        Object.assign(defaultPartApiConfigMap, partApiConfigMapFromEnv);
    } catch (err) {
        log.error('PART_API_CONFIG_MAP_BASE64_STR parse error:', err, process.env.PART_API_CONFIG_MAP_BASE64_STR);
    }
}

class IPService {
    #ip2RegionSearcher;
    #ip2RegionConfig = {
        emptyIpForceApiUrl: DEFAULT_USE_API_URL,
        mode: DEFAULT_IP2REGION_MODE, // 1: 完全基于文件的查询 | 2: 缓存 VectorIndex 索引 | 3: 缓存整个 xdb 数据
        dbPath: DEFAULT_IP2REGION_DB_PATH, // 指定ip2region数据文件路径
        bindingPath: DEFAULT_IP2REGION_BINDING_PATH // 指定nodejs binding文件路径
    }
    #cacheIp2RegionRequests = {};
    #cacheApiRequests = {};
	#useApiUrl = DEFAULT_USE_API_URL;
    #partApiConfigMap = JSON.parse(JSON.stringify(defaultPartApiConfigMap));
    #cacheIpInfos = {}; // {[ip]:[cacheTs, result]}

    get #currValidApiUrl () {
        if (this.#useApiUrl !== 'USE_LOCAL_IP2REGION' && this.#partApiConfigMap[this.#useApiUrl])
            return this.#useApiUrl;

        const foundApiUrl = this.getPartApiConfigKeys().find(item => item !== this.#useApiUrl) || '';
        this.#printlog('info', 'getCurrValidApiUrl Found valid apiUrl:', foundApiUrl, ' ,useApiUrl:', this.#useApiUrl, ' ,isForceFoundApiUrl:', isForceFoundApiUrl);
        return foundApiUrl;
    }

	setUseApiUrl (url) {
        this.#useApiUrl = url;
    }

    setPartApiConfig (apiUrl, apiConfig) {
        let partApiConfig = this.#partApiConfigMap[apiUrl];
		!partApiConfig && (this.#partApiConfigMap[apiUrl] = {});
        deepAssign(partApiConfig, apiConfig);
    }

    setIp2RegionConfig (ip2RegionConfig) {
        const { mode: oldMode, dbPath: oldDbPath } = this.#ip2RegionConfig;
        deepAssign(this.#ip2RegionConfig, ip2RegionConfig);
        if (this.#ip2RegionConfig.mode !== oldMode || this.#ip2RegionConfig.dbPath !== oldDbPath)
            this.#ip2RegionSearcher = null;
    }

    getPartApiConfigKeys () {
        return Object.keys(this.#partApiConfigMap);
    }

    getPartApiConfigMap () {
        return JSON.parse(JSON.stringify(this.#partApiConfigMap));
    }

    getPartApiConfig (apiUrl) {
        return this.#partApiConfigMap[apiUrl];
    }

    async search (ip='', {forceType, isCache}={}) {
        let caheIpInfo = isCache && ip ? this.#cacheIpInfos[ip] : undefined;
        this.#printlog('debug','call search ip:', ip, ' ,forceType:', forceType, ' ,isCache:', isCache, ' ,caheIpInfo:', caheIpInfo);

        this.#clearCacheIpResults();
        if (caheIpInfo && (Date.now() - caheIpInfo[0]) < 60000)
            return caheIpInfo[1];

        let result;
        if (forceType === 'ip2Region') { // 强制使用ip2region查询
            result = await this.searchByIp2Region(ip);
        } else if(forceType === 'api') { // 强制使用指定api查询
            result = await this.searchByIpApi(ip, true);
        } else if (ip && this.#useApiUrl === 'USE_LOCAL_IP2REGION') { // 指定了使用本地ip2region查询
            result = await this.searchByIp2Region(ip);
        } else { // 未指定强制使用api, 未指定使用本地ip2region查询, 则使用默认api查询
            result = await this.searchByIpApi(ip);
        }

        if (isCache && ip && result.code === 200) {
            this.#cacheIpInfos[ip] = [Date.now(), result];
        } else {
            ip && delete this.#cacheIpInfos[ip];
        }

        return result;
    }

    async searchByIpApi (ip='', isForceUseApi) {
        const startTs = Date.now();
        let reqUrl;
        try {
            this.#printlog('debug','call searchByIpApi ip:', ip, ' ,isForceUseApi:', isForceUseApi);
            if (ip === '::1') // 处理 ::1 问题
                throw 'searchByIpApi ip is ::1';

            if (!isForceUseApi && ip && this.#useApiUrl === 'USE_LOCAL_IP2REGION') { // 指定了使用本地ip2region查询
                this.#printlog('info', 'Use local ip2region search, ip:', ip);
                return this.searchByIp2Region(ip);
            }

            if (!isForceUseApi && ip && !this.#partApiConfigMap[this.#useApiUrl]) { // 未设置指定api的配置, 使用本地ip2region查询
                this.#printlog('warn', 'No api config found for', this.#useApiUrl, ', use local ip2region search, ip:', ip);
                return this.searchByIp2Region(ip);
            }

            const {
                method,
                url,
                headers,
                timeout,
                params,
                data,
                responseType,
                responseKeyMap = {},
                successRes
            } = this.#getApiConfig(ip);

            if (!url)
                throw 'No url found for ip api';

            reqUrl = url.replace('{{ip}}', ip);
            const response = await new Promise((resolve, reject) => {
                if (ip) {
                    let cacheApiRequest = this.#cacheApiRequests[ip];
                    if (cacheApiRequest && (cacheApiRequest.cacheTs && (Date.now() - cacheApiRequest.cacheTs) <  10000))
                        return cacheApiRequest.push(getPromiseCallback(resolve, reject));
            
                    cacheApiRequest = [];
                    cacheApiRequest.cacheTs = Date.now();
                    this.#cacheApiRequests[ip] = cacheApiRequest;
                    cacheApiRequest.push(getPromiseCallback(resolve, reject));
                }
    
                this.#printlog('debug', 'searchByIpApi axios reqUrl:', reqUrl);
                const axiosConfig = {
                    method,
                    url: reqUrl,
                    headers,
                    timeout,
                    params,
                    data,
                    responseType
                };
                for (const key in axiosConfig) {
                    if (axiosConfig[key] === undefined)
                        delete axiosConfig[key];
                }
    
                axios(axiosConfig).then(data => {
                    if (!ip) return resolve(data);
                	this.#runCacheRequest('api', ip, undefined, data);
            	}).catch(error => {
                    if (!ip) return reject(error);
                	this.#runCacheRequest('api', ip, error);
            	});
            })
            if (response.status !== 200) {
                this.#printlog('error', 'searchByIpApi status not is 200, status:', response.status, response.data, ip);
                return {
                    code: response.status,
                    data: response.data || 'searchByIpApi status not is 200',
                    ip: ip,
                    reqUrl: reqUrl,
                    diffTs: Date.now() - startTs
                };
            }
            const responseData = response.data;
            if (successRes && successRes.length >= 2) { // successRes = [successResKey,successResCode,failResMsg]
                const successResValue = getJsonValueByKey(responseData, successRes[0]);
                if (successResValue !== successRes[1]) {
                    this.#printlog('warn', 'searchByIpApi successRes not match, successRes:', successRes, ' ,successResValue:', successResValue, ' ,ip:', ip, ' ,responseData:', responseData);
                    return {
                        code: typeof successResValue === 'number' && successResValue !== 200 ? successResValue : 500,
                        data: successRes[2] && getJsonValueByKey(responseData, successRes[2]) ? getJsonValueByKey(responseData, successRes[2]) : (response.data || 'searchByIpApi successRes not match'),
                        ip: ip,
                        reqUrl: reqUrl,
                        diffTs: Date.now() - startTs
                    };
                }
            }

            const {
                location: locationKey,
                country: countryKey,
                area_code: areaCodeKey,
                province: provinceKey,
                city: cityKey,
                district: districtKey,
                isp: ispKey,
                regexMatch,
                locationConnChar = ' ',
                locationIspConnChar = ' —— '
            } = responseKeyMap;

            let location = getJsonValueByKey(responseData, locationKey, ip);
            let country = getJsonValueByKey(responseData, countryKey, ip);
            let area_code = getJsonValueByKey(responseData, areaCodeKey, ip);
            let province = getJsonValueByKey(responseData, provinceKey, ip);
            let city = getJsonValueByKey(responseData, cityKey, ip);
            let district = getJsonValueByKey(responseData, districtKey, ip);
            let isp = getJsonValueByKey(responseData, ispKey, ip);

            if (
                !(country || province || city) && regexMatch && typeof regexMatch === 'object'
                && regexMatch.key && Array.isArray(regexMatch.patterns) && regexMatch.patterns.length
            ) {
                const patterns = regexMatch.patterns;
                let checkStr = regexMatch.key === 'location' ? location : getJsonValueByKey(responseData, regexMatch.key, ip);
                if (checkStr) {
                    for (const regexStr of patterns) {
                        const regex = new RegExp(regexStr);
                        const match = checkStr.match(regex);
                        if (match && match.length > 1) {
                            !country && (country = match[1] ? match[1].trim() : '');
                            !province && (province = match[2] ? match[2].trim() : '');
                            !city && (city = match[3] ? match[3].trim() : '');
                            !district && (district = match[4] ? match[4].trim() : '');
                            !isp && (isp = match[5] ? match[5].trim() : '');
                            break;
                        }
                    }
                }
            }

            !location && (location = `${country || ''}${province ? locationConnChar + province : ''}${city && province !== city ? locationConnChar + city : ''}${isp ? (locationIspConnChar || locationConnChar) + isp : ''}`);

            const addressInfo = {
                location: location || '',
                country: country || '',
                area_code: area_code || '',
                province: province || '',
                city: city || (!country && !province ? location : ''),
                district: district || '',
                isp: isp || ''
            };

            if (!checkEffectiveAddressInfo(addressInfo)) {
                this.#printlog('warn', 'searchByIpApi effective addressInfo not found', ip, addressInfo);
                throw 'searchByIpApi effective addressInfo not found';
            }

            return {
                code: 200,
                data: addressInfo,
                ip: ip,
                reqUrl: reqUrl,
                diffTs: Date.now() - startTs,
                others: responseData
            }
        } catch (error) {
            this.#printlog('error', 'Error occurred while searching ip api', ip, error);
            return {
                code: 500,
                data: `Error occurred while searching ip api, errorMessage: ${typeof error === 'object' ? error.message : error}`,
                ip: ip,
                reqUrl: reqUrl,
                diffTs: Date.now() - startTs
            };
        }
    }

    async searchByIp2Region (ip='') {
        const startTs = Date.now();
        try {
            this.#printlog('debug','call searchByIp2Region ip:', ip);
            if (ip === '::1') // 处理 ::1 问题
                throw 'searchByIp2Region ip is ::1';

            if (!ip) { // 没有ip参数, 则通过api方式查询
                this.#printlog('info', 'No ip parameter, use api search, ip:', ip);
                return this.searchByIpApi(ip, true);
            }
            
            // 查询 await 或 promise均可，例子：data: {region: '中国|0|江苏省|苏州市|电信', ioCount: 2, took: 0.402874}
            const data = await new Promise((resolve, reject) => {
                if (ip) {
                    let cacheIp2RegionRequest = this.#cacheIp2RegionRequests[ip];
                    if (cacheIp2RegionRequest && (cacheIp2RegionRequest.cacheTs && (Date.now() - cacheIp2RegionRequest.cacheTs) <  10000))
                        return cacheIp2RegionRequest.push(getPromiseCallback(resolve, reject));
            
                    cacheIp2RegionRequest = [];
                    cacheIp2RegionRequest.cacheTs = Date.now();
                    this.#cacheIp2RegionRequests[ip] = cacheIp2RegionRequest;
                    cacheIp2RegionRequest.push(getPromiseCallback(resolve, reject));
                }
				
        		const searcher = this.#getIp2RegionSearcher();
        		if (!searcher)
            		return this.#runCacheRequest('ip2Region', ip, new Error('ip2region searcher not found'));
        
        		searcher.search(ip).then(data => {
                    if (!ip) return resolve(data);
                	this.#runCacheRequest('ip2Region', ip, undefined, data);
            	}).catch(error => {
                    if (!ip) return reject(error);
                	this.#runCacheRequest('ip2Region', ip, error);
            	});
            });
            const { region: regionStr, ...others } = data;
            const addressInfo = {
                location: '',
                country: '',
                area_code: '',
                province: '',
                city: '',
                district: '',
                isp: ''
            };

            const regionSplit = regionStr.split('|'); // 国家、区域编码、省份、城市和运营商
            addressInfo.country = regionSplit[0] !== '0' ? regionSplit[0] : ''
            addressInfo.area_code = regionSplit[1] !== '0' ? regionSplit[1] : ''
            addressInfo.province = regionSplit[2] !== '0' ? regionSplit[2] : ''
            addressInfo.city = regionSplit[3] !== '0' ? regionSplit[3] : ''
            addressInfo.isp = regionSplit[4] !== '0' ? regionSplit[4] : ''
            addressInfo.location = `${addressInfo.country ||''}${addressInfo.province ? ' '+addressInfo.province : ''}${addressInfo.city && addressInfo.province !== addressInfo.city ? ' '+addressInfo.city : ''}${addressInfo.isp ? ' —— '+addressInfo.isp : ''}`

            if (!checkEffectiveAddressInfo(addressInfo)) {
                this.#printlog('warn', 'searchByIpApi effective addressInfo not found', ip, addressInfo);
                throw 'searchByIpApi effective addressInfo not found';
            }

            return {
                code: 200,
                data: addressInfo,
                ip: ip,
                dbSource: 'ip2region',
                diffTs: Date.now() - startTs,
                others: others
            }
        } catch (error) {
            this.#printlog('error', 'Error occurred while searching ip2region', ip, error);
            return {
                code: 500,
                data: `Error occurred while searching ip2region, errorMessage: ${typeof error === 'object' ? error.message : error}`,
                ip: ip,
                dbSource: 'ip2region',
                diffTs: Date.now() - startTs
            };
        }
    }

    #getApiConfig (searchIp) {
        let ipApiUrl = this.#currValidApiUrl;
        let partApiConfig = this.#partApiConfigMap[ipApiUrl];
        if (!searchIp && partApiConfig && partApiConfig.emptyIpForceApiUrl) {
            this.#printlog('info', 'apiConfig for set ipApiUrl to emptyIpForceApiUrl, searchIp:', searchIp, ' ,emptyIpForceApiUrl:', partApiConfig.emptyIpForceApiUrl, ' ,ipApiUrl:', ipApiUrl);
            ipApiUrl = partApiConfig.emptyIpForceApiUrl;
        }
        partApiConfig = this.#partApiConfigMap[ipApiUrl];

        const config = {
        	method: 'GET',
			url: ipApiUrl,
        	headers: undefined,
        	timeout: 10000,
        	params: undefined,
        	data: undefined,
       		responseType: 'json',
        	responseKeyMap: {
            	location: '',
            	location: '',
            	regexMatch: {
                	key: '',
                	patterns: []
            	},
            	country: '',
            	area_code: '',
            	province: '',
            	city: '',
    	        district: '',
	            isp: ''
        	}
        }

        if (!searchIp && partApiConfig && partApiConfig.emptyIpUrl) {
            this.#printlog('info', 'apiConfig for set url to emptyIpUrl, searchIp:', searchIp, ' ,emptyIpUrl:', partApiConfig.emptyIpUrl, ' ,config.url:', config.url, ' ,ipApiUrl:', ipApiUrl);
            config.url = partApiConfig.emptyIpUrl;
        }
        
        deepAssign(config, partApiConfig || {});

        return config;
    }

    #runCacheRequest (type, ip, error, data) {
        let cacheRequest;
        switch (type) {
            case 'ip2Region': {
                cacheRequest = this.#cacheIp2RegionRequests[ip];
        		delete this.#cacheIp2RegionRequests[ip];
                break;
            }
            case 'api': {
                cacheRequest = this.#cacheApiRequests[ip];
                delete this.#cacheApiRequests[ip];
                break;
            }
        }

        if (!cacheRequest || !cacheRequest.length) return;
        for (const cacheCb of cacheRequest) {
        	try {
            	cacheCb && cacheCb(error, data);
        	} catch (catchError) {
        		this.#printlog('error', '#runCacheRequest cacheCb catchError', ip, catchError);
    		}
        }
    }

    #getIp2RegionSearcher () {
        try {
            if (!this.#ip2RegionSearcher) {
                const { mode, dbPath, bindingPath } = this.#ip2RegionConfig;
                // 导入包
                const Searcher = require(bindingPath);
                switch (mode) {
                    case 1: { //  完全基于文件的查询
                        // 创建searcher对象
                        const searcher = Searcher.newWithFileOnly(dbPath);
                        this.#ip2RegionSearcher = searcher;
                        break;
                    }
                    case 2: { //  缓存 VectorIndex 索引
                        // 同步读取vectorIndex
                        const vectorIndex = Searcher.loadVectorIndexFromFile(dbPath);
                        // 创建searcher对象
                        const searcher = Searcher.newWithVectorIndex(dbPath, vectorIndex);
                        this.#ip2RegionSearcher = searcher;
                        break;
                    }
                    case 3: { //  缓存整个 xdb 数据
                         // 同步读取buffer
                        const buffer = Searcher.loadContentFromFile(dbPath);
                        // 创建searcher对象
                        const searcher = Searcher.newWithBuffer(buffer);
                        this.#ip2RegionSearcher = searcher;
                        break;
                    }
                    default: {
                        throw new Error('Invalid ip2region mode');
                    }
                }
            }
    
            return this.#ip2RegionSearcher;
        } catch (error) {
            this.#printlog('error', 'Error occurred while creating ip2region searcher', error);
        }
    }

    #clearCacheIpResults () {
        for (const ip in this.#cacheIpInfos) {
            if (this.#cacheIpInfos[ip][0] && (Date.now() - this.#cacheIpInfos[ip][0]) > 60000) {
                delete this.#cacheIpInfos[ip];
            }
        }
    }

    #printlog (method, ...args) {
        if (!log[method]) {
            log.error(new Error(`Invalid log method: ${method}`), ...args, ' ,IPService');
            return;
        }

        log[method](...args, ' ,IPService');
    }
}

const ipServiceInstance = new IPService();
module.exports = ipServiceInstance;
