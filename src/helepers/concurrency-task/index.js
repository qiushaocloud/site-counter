class ConcurrencyTaskController {
  #insId = Math.random();
  #maxConcurrency = 20;
  #runningTaskCount = 0;
  #taskQueue = [];
  #taskTimeout = 10000;
  #log = null;

  constructor(log, {maxConcurrency, taskTimeout}={}) {  
    log && (this.#log = log);
    typeof maxConcurrency === 'number' && maxConcurrency > 0 && (this.#maxConcurrency = maxConcurrency);  
    typeof taskTimeout === 'number' && taskTimeout > 0 && (this.#taskTimeout = taskTimeout);
    this.#printLog('info', 'ConcurrencyTaskController initialized with maxConcurrency:', this.#maxConcurrency, 'and taskTimeout:', this.#taskTimeout);
  }

  destroy() {
    this.#printLog('info', 'Task controller destroyed');
    this.#log = null;
    this.#taskQueue = [];
    this.#runningTaskCount = 0;
  }
  
  addTask(task) {
    const taskTmp = this.#wrapTask(task);
    taskTmp.taskid = Math.random();
    this.#taskQueue.push(taskTmp);
    this.#printLog('debug', 'Task added:', taskTmp.taskid, ' ,taskArgsLength:', task.length, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#taskQueue.length);  
    this.#processQueue();  
  }  
  
  #wrapTask(task) {  
    return () => {  
      let timer;
      return new Promise((resolve, reject) => {  
        try {
          let result;
          let isPromise = false;
          let taskArgsLength = task.length;
          timer && clearTimeout(timer);
          timer = setTimeout(() => {  
            timer = null;
            reject(new Error('Task timeout'));  
          }, this.#taskTimeout);

          if (taskArgsLength === 1) {
            result = task((...callArgs) => {
              if (isPromise) return; // promise 不能走这里
              if (callArgs.length === 0) return resolve();
              if (callArgs[0] && callArgs[0] instanceof Error) {
                reject(callArgs[0]);
                return;
              }
              resolve(callArgs.length === 1? callArgs[0] : callArgs);
            });  
          } else if (taskArgsLength > 1) {
            result = task(resolve, reject);
          } else {
            result = task();
          }

          if (result instanceof Promise) {  
            isPromise = true;
            result.then(resolve).catch(reject);  
          } else if (!taskArgsLength) {
            resolve(result);  
          }  
        } catch (err) {  
          reject(err);  
        }
      }).finally(() => {
        timer && clearTimeout(timer);
        timer = null;
      });
    };  
  }  
  
  #processQueue() {  
    while (this.#runningTaskCount < this.#maxConcurrency && this.#taskQueue.length > 0) {  
      const task = this.#taskQueue.shift();  
      this.#runTask(task);  
    }  
  }  
  
  #runTask(task) {  
    this.#runningTaskCount++;
    const taskid = task.taskid;  
    this.#printLog('debug', 'Task started:', taskid, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#taskQueue.length);  
    task()
      .then((result) => {  
        this.#runningTaskCount--;  
        this.#printLog('debug', 'Task completed:', taskid, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#taskQueue.length);  
        this.#processQueue();  
        return result;  
      })  
      .catch((err) => {  
        this.#runningTaskCount--;  
        this.#printLog('error', 'Task failed:', taskid, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#taskQueue.length, ' ,err:', err);  
        this.#processQueue();
      });  
  }

  #printLog(method, ...args) {
    if (!this.#log) return;
    if (!this.#log[method]) {
      this.#log.error(`Invalid log method: ${method}`, ...args, ' ,insId:', this.#insId);
      return;
    }
    this.#log[method](...args, ' ,insId:', this.#insId);
  }
}

module.exports = ConcurrencyTaskController;