import { mkdirp, pathExists, readdir, unlink, writeFile, writeJSON, unlinkSync } from 'fs-extra';
import chokidar from 'chokidar';
import { first } from 'lodash';
import path, { basename, join } from 'path';

async function getSingleRunDirPath(): Promise<string> {
    const singleRunDirPath = path.resolve(process.env.HOME, 'single-run-dir');
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
        try {
            unlinkSync(join(dirPath, queueFile));
        } catch (e) { }
    });

    let taskTimer;
    return new Promise((resolve) => {
        const watcher = chokidar.watch(dirPath);

        watcher.on('unlink', async (fileName) => {
            const queueList = await listQueue();
            const taskExists = await pathExists(taskFile);

            if (basename(fileName) === 'task' || !taskExists) {
                clearTimeout(taskTimer);

                if (first(queueList) === queueFile) {
                    await unlink(join(dirPath, queueFile));
                    await watcher.close();
                    resolve();
                } else if (queueList.length > 0) {
                    setTimeout(() => {
                        pathExists(taskFile)
                            .then((exists) => !exists && unlink(join(dirPath, first(queueList))))
                            .catch(() => { });
                    }, 2000);
                }
            }
        });

        watcher.on('add', async (fileName) => {
            if (basename(fileName) === 'task') {
                taskTimer = setTimeout(() => {
                    unlink(taskFile).catch(() => { });
                }, 10000);
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
        } catch (e) { }
    });

    return () => unlink(taskFile).catch(() => { });
}
