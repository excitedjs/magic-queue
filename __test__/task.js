const { delay } = require('../lib/utils.js');
const { queued } = require('../lib/single-run.js');

const [,, number] = process.argv;
async function task() {
    const dispose = await queued('task-' + number);

    await delay(5000);

    console.log(number + ' done');

    await dispose();
}

task();