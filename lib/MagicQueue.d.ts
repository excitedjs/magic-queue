import { MagicQueueOptions } from "./types";
export declare class MagicQueue {
    private options;
    constructor(options: MagicQueueOptions);
    queueUp(): Promise<void>;
}
