const { spawn } = require('child_process');
const { resolve } = require('path');

for (let index = 0; index < 2; index++) {
    spawn(process.execPath, [
        resolve(__dirname, 'task.js'),
        index
    ], {
        stdio: 'inherit'
    });
}