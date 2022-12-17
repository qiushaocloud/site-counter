const path = require('path');
const log4js = require('log4js');

const LOG_DIR = path.resolve(__dirname, '../../logs')

log4js.configure({
  appenders: {
    console:{ // 输出到控制台
      type : 'console',
    },
    log_file:{ // 输出到文件
      type : 'file',
      filename: `${LOG_DIR}/site-counter-normal.log`,
      maxLogSize : 20971520,
      backups : 10,
      encoding : 'utf-8'
    },
    ips_data_file:{ // 输出到日期文件
      type: "dateFile",
      filename: `${LOG_DIR}/site-counter-ips.log`,
      alwaysIncludePattern: true,
      daysToKeep:10,
      encoding : 'utf-8'
    },
    error_file:{ // 输出到error log
      type: "dateFile",
      filename: `${LOG_DIR}/site-counter-error.log`,
      alwaysIncludePattern: true,
      daysToKeep:10,
      encoding : 'utf-8'
    }
  },
  categories: {
    default:{
      appenders:[
        'console',
        'log_file'
      ],
      level:'debug'
    },
    RequestIps:{
      appenders:[
        'console',
        'ips_data_file'
      ],
      level:'info'
    },
    console:{
      appenders:[
        'console'
      ],
      level:'debug'
    },
    debug_log:{
      appenders:[
        'console',
        'log_file'
      ],
      level:'debug'
    },
    info_log:{
      appenders:[
        'console',
        'log_file'
      ],
      level:'info'
    },
    warn_log:{
      appenders:[
        'error_file'
      ],
      level:'warn'
    },
    error_log:{
      appenders:[
        'error_file'
      ],
      level:'error'
    }
  }
});

module.exports = log4js;