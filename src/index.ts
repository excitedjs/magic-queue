import { mkdirp, pathExists, readdir, unlink, watch, writeFile } from 'fs-extra';
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

    return new Promise((resolve) => {
        const watcher = watch(dirPath, async (event, filePath) => {
            console.log(event, filePath);
            if (filePath === 'task' && event === 'rename') {
                const queueList = await listQueue();

                if (first(queueList) === queueFile && !(await pathExists(taskFile))) {
                    await unlink(join(dirPath, queueFile));
                    watcher.close();
                    resolve();
                }
            }
        });
    });
}

export async function queued() {
    const singleRunDirPath = await getSingleRunDirPath();

    const taskFile = join(singleRunDirPath, 'task');

    await waitQueueDispose(singleRunDirPath);

    await writeFile(taskFile, '');

    return () => unlink(taskFile);
}
