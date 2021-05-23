# magic-queue

一个神奇的队列，可以让你的互相隔离的多进程任务通过抢占式的方式排队执行。

## 典型使用场景

用于ci环境，某些操作系统上的任务可能同时只允许一个任务执行，比如mac应用的公证上传过程，但是ci任务会同时并发多个，此时就需要将这些任务的公证流程进行排队。

## 用法

```javascript
const { queued } = require('magic-queue')

async function task() {
    const dispose = await queued('task name')

    await doSomeTask() // 在这里执行你的任务，同步异步都支持

    await dispose()
}

```
