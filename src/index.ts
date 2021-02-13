import { MagicQueue } from './MagicQueue';
import { MagicQueueOptions } from './types';

export function magicQueue(options: MagicQueueOptions): MagicQueue {
    return new MagicQueue(options);
}
