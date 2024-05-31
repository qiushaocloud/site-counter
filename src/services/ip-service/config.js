const partApiConfigMap = {
    'http://yuanxiapi.cn/api/iplocation?ip={{ip}}': {
        emptyIpForceApiUrl: 'https://webapi-pc.meitu.com/common/ip_location?ip={{ip}}',
        successRes: ['code',200,'msg'],
        responseKeyMap: {
            location: 'location',
            regexMatch: {
                key: 'location',
                patterns: [
                    '^(中国)(.*?省|.*?自治区)?(.*?市)?(.*?区|.*?县)?(.+)$',
                    '^(.*) (.*?)(.*?)(.*?)(.*?)$',
                    '^(.*国)(.*?州|.*?郡|.*?)(.*?市|.*?)(.*?)(.*?)$'
                ]
            }
        }   
    },
    'https://webapi-pc.meitu.com/common/ip_location?ip={{ip}}': {
        responseKeyMap: {
            location: '',
            country: 'data.[searchIp].nation',
            area_code: 'data.[searchIp].area_code',
            province: 'data.[searchIp].province',
            city: 'data.[searchIp].city',
            district: '',
            isp: 'data.[searchIp].isp'
        }
    },
    'http://ip-api.com/json/{{ip}}?lang=zh-CN': {
        successRes: ['status','success','message'],
        responseKeyMap: {
            location: '',
            country: 'country',
            area_code: '',
            province: 'regionName',
            city: 'city',
            district: '',
            isp: 'isp'
        }
    },
    'https://api.ip2location.io/?ip={{ip}}': {
        emptyIpUrl: 'https://api.ip2location.io/',
        responseKeyMap: {
            location: '',
            country: 'country_name',
            area_code: '',
            province: 'region_name',
            city: 'city_name',
            district: '',
            isp: 'as'
        }
    },
    'https://api.qjqq.cn/api/district?ip={{ip}}': {
        emptyIpUrl: 'https://api.qjqq.cn/api/Local',
        successRes: ['code',200,'msg'],
        responseKeyMap: {
            location: '',
            country: 'data.country',
            area_code: 'data.area_code',
            province: 'data.prov',
            city: 'data.city',
            district: 'data.district',
            isp: 'data.isp'
        }
    }
};

// 配置 ip 服务的地址，如果指定为 USE_LOCAL_IP2REGION，则使用本地 ip2region 库进行查询
// const defaultUseApiUrl = 'USE_LOCAL_IP2REGION';
const defaultUseApiUrl = 'http://yuanxiapi.cn/api/iplocation?ip={{ip}}';

const defaultIp2Region = {
    mode: 2, // 1: 完全基于文件的查询 | 2: 缓存 VectorIndex 索引 | 3: 缓存整个 xdb 数据
    dbPath: './ip2region/data/ip2region.xdb',
    bindingPath: './ip2region/binding/nodejs/index.js'
}

module.exports = {
    partApiConfigMap,
    defaultUseApiUrl,
    defaultIp2Region
}