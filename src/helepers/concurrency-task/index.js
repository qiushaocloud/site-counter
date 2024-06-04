class ConcurrencyTaskController {  
  #maxConcurrency = 20;
  #runningTaskCount = 0;
  #queue = [];
  #taskTimeout = 10000;

  constructor(maxConcurrency, taskTimeout) {  
    typeof maxConcurrency === 'number' && maxConcurrency > 0 && (this.#maxConcurrency = maxConcurrency);  
    typeof taskTimeout === 'number' && taskTimeout > 0 && (this.#taskTimeout = taskTimeout);  
  }
  
  addTask(task) {
    const taskTmp = this.#wrapTask(task);
    taskTmp.taskid = Math.random();
    console.log('Task added:', taskTmp.taskid, ' ,taskArgsLength:', task.length, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#queue.length);  
    this.#queue.push(taskTmp);
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
    while (this.#runningTaskCount < this.#maxConcurrency && this.#queue.length > 0) {  
      const task = this.#queue.shift();  
      this.#runTask(task);  
    }  
  }  
  
  #runTask(task) {  
    this.#runningTaskCount++;
    const taskid = task.taskid;  
    console.log('Task started:', taskid, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#queue.length);  
    task()
      .then((result) => {  
        this.#runningTaskCount--;  
        console.log('Task completed:', taskid, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#queue.length);  
        this.#processQueue();  
        return result;  
      })  
      .catch((err) => {  
        this.#runningTaskCount--;  
        console.error('Task failed:', taskid, ' ,runningTaskCount:', this.#runningTaskCount, ' ,queueLength:', this.#queue.length, ' ,err:', err);  
        this.#processQueue();
      });  
  }  
}