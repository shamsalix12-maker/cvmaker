import { CVManager } from './types';
import { V1StableManager } from './v1-stable-manager';
import { V2ExperimentalManager } from './v2-experimental-manager';

export enum CVManagerVersion {
    V1_STABLE = 'v1-stable',
    V2_EXPERIMENTAL = 'v2-experimental'
}

export class CVManagerFactory {
    private static v1 = new V1StableManager();
    private static v2 = new V2ExperimentalManager();

    static getManager(version: string = CVManagerVersion.V1_STABLE): CVManager {
        switch (version) {
            case CVManagerVersion.V2_EXPERIMENTAL:
                return this.v2;
            case CVManagerVersion.V1_STABLE:
            default:
                return this.v1;
        }
    }

    /**
     * Get manager by experimental flag or environment
     */
    static getCurrentManager(): CVManager {
        // In the future, we can load this from a setting or cookie
        // For now, default to V1
        return this.v1;
    }
}
