import { MagicQueueOptions } from './types';

export class MagicQueue {
    constructor(private options: MagicQueueOptions) {
    }

    async queueUp() {
        console.log(this.options);
    }
}
