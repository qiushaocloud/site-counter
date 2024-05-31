class Utils {
  getCurrFormatTs (date, isOnlyGetSec, isOnlyDay) {
    if (!date || typeof date === 'number' || typeof date ==='string') {
      if (typeof date === 'number' || (typeof date ==='string' && !/^\d+$/.test(date)))
        date = new Date(date);
      else if (typeof date ==='string')
        date = new Date(Number(date));
      else
        date = new Date();
    }
    
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
  
    if (month < 10)
      month = '0' + month;
  
    if (day < 10)
      day = '0' + day;
  
    if (isOnlyDay)
      return year + '-' + month + '-' + day; 
    
    if (hours < 10)
      hours = '0' + hours;
  
    if (minutes < 10)
      minutes = '0' + minutes;
  
    if (seconds < 10)
      seconds = '0' + seconds;
  
    if (isOnlyGetSec)
      return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
      
    let milliseconds = date.getMilliseconds();

    if (milliseconds < 10)
      milliseconds = '00' + milliseconds;
    else if (milliseconds < 100)
      milliseconds = '0' + milliseconds;

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
  }

  getDateRange(startDateStr, endDateStr, maxDays) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const dateRange = [];

    // Iterate through each day between startDate and endDate
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        dateRange.push(date.toISOString().slice(0, 10));
        if (maxDays && dateRange.length >= maxDays) break;
    }

    return dateRange;
  }

  /* 是否是数字 */
  isNumber(arg) {
    return (typeof arg === 'number' && !isNaN(arg));
  }

  /* 转为数字 */
  toParseNumber(arg) {
    if (arg === undefined || arg === null || arg === '')
      return undefined;

    const num = Number(arg);
    if (this.isNumber(num))
      return num;

    return undefined;
  }

  /* 转为布尔类型*/
  toParseBoolean (arg) {
    let isBool = false;
    
    if (!(arg === undefined || arg === null || arg === '')) {
      if (typeof arg === 'boolean') {
        isBool = arg;
      } else if (typeof arg === 'number') {
        isBool = !!arg;
      } else if (typeof arg === 'string') {
        const argNum = Number(arg);
        if (typeof argNum === 'number' && !isNaN(argNum)) {
          isBool = !!argNum;
        } else {
          isBool = (arg === 'true');
        }
      }
    }

    return isBool;
  }
}

module.exports = new Utils();