import { V1StableManager } from './v1-stable-manager';

export enum CVManagerVersion {
    V1_STABLE = 'v1-stable',
    V2 = 'v2'
}

export class CVManagerFactory {
    private static v1 = new V1StableManager();

    static getManager(version: string = CVManagerVersion.V1_STABLE): any {
        return this.v1;
    }

    /**
     * Get manager by experimental flag or environment
     */
    static getCurrentManager(): any {
        // In the future, we can load this from a setting or cookie
        // For now, default to V1
        return this.v1;
    }
}
