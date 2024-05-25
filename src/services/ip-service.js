const axios = require('axios');
const {getLogger} = require('../log');
const log = getLogger('Service');

const getJsonValueByKey = (json, key) => {
    try {
        if (!key) return undefined;
        
        if (typeof json !== 'object') return undefined;
        const keys = key.split('.');
        let value = json;
        
        for (const k of keys) {
            if (!k) continue;
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    } catch (err) {
        console.error('getJsonValueByKey catch error:', err, key, json);
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

class IpService {
    #ip2RegionSearcher;
    #ip2RegionConfig = {
        mode: 2, // 1: 完全基于文件的查询 | 2: 缓存 VectorIndex 索引 | 3: 缓存整个 xdb 数据
        dbPath: '../../libs/ip2region/data/ip2region.xdb', // 指定ip2region数据文件路径
        bindingPath: '../../libs/ip2region/binding/nodejs/index.js' // 指定nodejs binding文件路径
    }
	#useApiUrl = 'http://ip-api.com/json/{{ip}}?lang=zh-CN';
    #preApiConfigMap = {
        'http://yuanxiapi.cn/api/iplocation?ip={{ip}}': {
            responseKeyMap: {
                location: 'location',
                regexMatch: {
                	key: 'location',
                	patterns: [
                        '^(中国)(.*?省|.*?自治区)?(.*?市)?(.*?区|.*?县)?(.+)$',
                        '^(.*) (.*?)(.*?)(.*?)(.*?)$',
                        '^(.*国)(.*?)(.*?)(.*?)(.*?)$'
                	]
            	}
            }   
        },
        'http://ip-api.com/json/{{ip}}?lang=zh-CN': {
        	responseKeyMap: {
                location: '',
                country: 'country',
            	regionCode: '',
            	province: 'regionName',
	            city: 'city',
    	        district: '',
        	    isp: 'isp'
            }
        }
    }
    get #apiConfig () {
        const config = {
        	method: 'GET',
			url: this.#useApiUrl,
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
            	regionCode: '',
            	province: '',
            	city: '',
    	        district: '',
	            isp: ''
        	}
        }
        
        deepAssign(config, this.#preApiConfigMap[this.#useApiUrl] || {});

        return config;
    }
    #cacheIp2RegionRequests = {};
    #cacheApiRequests = {};
    
	setUseApiUrl (url) {
        this.#useApiUrl = url;
    }

    setPreApiConfig (apiUrl, apiConfig) {
        let preApiConfig = this.#preApiConfigMap[apiUrl];
		!preApiConfig && (this.#preApiConfigMap[apiUrl] = {});
        deepAssign(preApiConfig, apiConfig);
    }

    setIp2RegionConfig (ip2RegionConfig) {
        const { mode: oldMode, dbPath: oldDbPath } = this.#ip2RegionConfig;
        deepAssign(this.#ip2RegionConfig, ip2RegionConfig);

        if (this.#ip2RegionConfig.mode !== oldMode || this.#ip2RegionConfig.dbPath !== oldDbPath) {
            this.#ip2RegionSearcher = null;
        }
    }

    async searchByIpApi (ip) {
        const startTs = Date.now();
        let reqUrl;
        try {
            const {
                method,
                url,
                headers,
                timeout,
                params,
                data,
                responseType,
                responseKeyMap = {}
            } = this.#apiConfig;

            reqUrl = url.replace('{{ip}}', ip);
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

            console.error('ccc', axiosConfig);
            const response = await axios(axiosConfig);
            console.error(111, response);
            const responseData = response.data;

            const {
                location: locationKey,
                country: countryKey,
                regionCode: regionCodeKey,
                province: provinceKey,
                city: cityKey,
                district: districtKey,
                isp: ispKey,
                regexMatch
            } = responseKeyMap;

            let location = getJsonValueByKey(responseData, locationKey);
            let country = getJsonValueByKey(responseData, countryKey);
            let regionCode = getJsonValueByKey(responseData, regionCodeKey);
            let province = getJsonValueByKey(responseData, provinceKey);
            let city = getJsonValueByKey(responseData, cityKey);
            let district = getJsonValueByKey(responseData, districtKey);
            let isp = getJsonValueByKey(responseData, ispKey);

            if (
                !(country || province || city) && regexMatch && typeof regexMatch === 'object'
                && regexMatch.key && Array.isArray(regexMatch.patterns) && regexMatch.patterns.length
            ) {
                const patterns = regexMatch.patterns;
                let checkStr = regexMatch.key === 'location' ? location : getJsonValueByKey(responseData, regexMatch.key);
                if (checkStr) {
                    for (const regexStr of patterns) {
                        const regex = new RegExp(regexStr);
                        const match = checkStr.match(regex);
                        if (match && match.length > 1) {
                            !country && (country = match[1] ? match[1].trim() : '');
                            !province && (province = match[2] ? match[2] : '');
                            !city && (city = match[3] ? match[3] : '');
                            !district && (district = match[4] ? match[4] : '');
                            !isp && (isp = match[5] ? match[5] : '');
                            break;
                        }
                    }
                }
            }

            !location && (location = `${country || ''}${province || ''}${city || ''}${isp || ''}`);

            const addressInfo = {
                location: location || '',
                country: country || '',
                regionCode: regionCode || '',
                province: province || '',
                city: city || location || '',
                district: district || '',
                isp: isp || ''
            };

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

    async searchByIp2Region (ip) {
        const startTs = Date.now();
        try {
            // 查询 await 或 promise均可，例子：data: {region: '中国|0|江苏省|苏州市|电信', ioCount: 2, took: 0.402874}
            const data = await new Promise((resolve, reject) => {
				let cacheIp2RegionRequest = this.#cacheIp2RegionRequests[ip];
        		if (cacheIp2RegionRequest && (cacheIp2RegionRequest.cacheTs && (Date.now() - cacheIp2RegionRequest.cacheTs) <  10000))
            		return cacheIp2RegionRequest.push(getPromiseCallback(resolve, reject));
        
        		cacheIp2RegionRequest = [];
        		cacheIp2RegionRequest.cacheTs = Date.now();
        		this.#cacheIp2RegionRequests[ip] = cacheIp2RegionRequest;
        		cacheIp2RegionRequest.push(getPromiseCallback(resolve, reject));

        		const searcher = this.#getIp2RegionSearcher();
        		if (!searcher)
            		return this.#runCacheRequest('ip2Region', ip, new Error('ip2region searcher not found'));
        
        		searcher.search(ip) .then(data => {
                	this.#runCacheRequest('ip2Region', ip, undefined, data);
            	}).catch(error => {
                	this.#runCacheRequest('ip2Region', ip, error);
            	});
            });

            const { region: regionStr, ...others } = data;

            const addressInfo = {
                location: '',
                country: '',
                regionCode: '',
                province: '',
                city: '',
                district: '',
                isp: ''
            };

            const regionSplit = regionStr.split('|'); // 国家、区域编码、省份、城市和运营商
            addressInfo.country = regionSplit[0] !== '0' ? regionSplit[0] : ''
            addressInfo.regionCode = regionSplit[1] !== '0' ? regionSplit[1] : ''
            addressInfo.province = regionSplit[2] !== '0' ? regionSplit[2] : ''
            addressInfo.city = regionSplit[3] !== '0' ? regionSplit[3] : ''
            addressInfo.isp = regionSplit[4] !== '0' ? regionSplit[4] : ''
            addressInfo.location = `${addressInfo.country ||''}${addressInfo.province || ''}${addressInfo.city || ''}${addressInfo.isp || ''}`

            return {
                code: 200,
                data: addressInfo,
                ip: ip,
                diffTs: Date.now() - startTs,
                others: others
            }
        } catch (error) {
            this.#printlog('error', 'Error occurred while searching ip2region', ip, error);
            return {
                code: 500,
                data: `Error occurred while searching ip2region, errorMessage: ${typeof error === 'object' ? error.message : error}`,
                ip: ip,
                diffTs: Date.now() - startTs
            };
        }
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

    #printlog (method, ...args) {
        if (!log[method]) {
            log.error(new Error(`Invalid log method: ${method}`), ...args, ' ,IpService');
            return;
        }

        log[method](...args, ' ,IpService');
    }
}

const ipServiceInstance = new IpService();
module.exports = ipServiceInstance;

/*
ipServiceInstance.searchByIp2Region('180.136.0.7')
    .then(res => {
        console.log('searchByIp2Region res', res);
    })
    .catch(err => {
        console.error('searchByIp2Region err', err);
    })

ipServiceInstance.searchByIp2Region('180.136.0.7')
    .then(res => {
        console.log('searchByIp2Region res', res);
    })
    .catch(err => {
        console.error('searchByIp2Region err', err);
    })

ipServiceInstance.searchByIp2Region('180.136.0.7')
    .then(res => {
        console.log('searchByIp2Region res', res);
    })
    .catch(err => {
        console.error('searchByIp2Region err', err);
    })
*/
ipServiceInstance.searchByIpApi('180.136.0.7')
    .then(res => {
        console.log('searchByIpApi res', res);
    })
    .catch(err => {
        console.error('searchByIpApi err', err);
    })