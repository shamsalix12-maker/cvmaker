import { V1StableManager } from './v1-stable-manager';

/**
 * Experimental Manager (V2)
 * Initially a clone of V1, but will be used to implement new logic
 */
export class V2ExperimentalManager extends V1StableManager {
    readonly id: string = 'v2-experimental';
    readonly name: string = 'Experimental Manager';
    readonly version: string = '2.0.0-alpha';

    // We can override methods here to test new logic
}
