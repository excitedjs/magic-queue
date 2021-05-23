import { mkdirp, pathExists, readdir, unlink, watch, writeFile, writeJSON, unlinkSync } from 'fs-extra';
import { first } from 'lodash';
import { join, resolve } from 'path';

async function getSingleRunDirPath(): Promise<string> {
    const singleRunDirPath = resolve(process.env.HOME, 'single-run-dir');
    if (!(await pathExists(singleRunDirPath))) {
        await mkdirp(singleRunDirPath);
    }
    return singleRunDirPath;
}

async function waitQueueDispose(dirPath: string): Promise<void> {
    const taskFile = join(dirPath, 'task');

    if (!(await pathExists(taskFile))) {
        return;
    }

    const queueFile = `queue-${Date.now()}`;

    await writeFile(join(dirPath, queueFile), '');

    async function listQueue() {
        const files = await readdir(dirPath);
        return files.filter((file) => file.startsWith('queue-')).sort();
    }

    process.once('exit', () => {
        unlinkSync(join(dirPath, queueFile));
    });

    let taskTimer;
    return new Promise((resolve) => {
        const watcher = watch(dirPath, async (event, fileName) => {
            if (event === 'rename') {
                const queueList = await listQueue();
                const taskExists = await pathExists(taskFile);
                if (fileName === 'task' && taskExists) {
                    clearTimeout(taskTimer);
                }

                if (taskExists) {
                    taskTimer = setTimeout(() => {
                        unlink(taskFile);
                    }, 600000);
                } else if (first(queueList) === queueFile) {
                    await unlink(join(dirPath, queueFile));
                    watcher.close();
                    resolve();
                    return;
                } else {
                    setTimeout(() => {
                        unlink(first(queueList)).catch((e) => {
                            console.debug(e)
                        });
                    }, 2000);
                }
            }
        });
    });
}

export async function queued(taskIdentifier: string) {
    const singleRunDirPath = await getSingleRunDirPath();

    const taskFile = join(singleRunDirPath, 'task');

    await waitQueueDispose(singleRunDirPath);

    await writeJSON(taskFile, {
        identifier: taskIdentifier,
        startAt: Date.now()
    });

    process.once('exit', () => {
        try {
            unlinkSync(taskFile);
        } catch (e) {
            console.debug(e)
        }
    });

    return () => unlink(taskFile).catch((e) => {
        console.debug(e)
    });
}
