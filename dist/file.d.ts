import * as Context from '@terrencecrowley/context';
import * as Storage from '@terrencecrowley/storage';
import * as FSM from '@terrencecrowley/fsm';
import * as LogAbstract from '@terrencecrowley/logabstract';
export interface StorageFileEnvironment {
    context: Context.IContext;
    log: LogAbstract.ILog;
    fsmManager: FSM.FsmManager;
}
export declare class StorageManager extends Storage.StorageManager {
    bStarting: boolean;
    bFailedStart: boolean;
    totalOps: number;
    outstandingOps: number;
    constructor(env: StorageFileEnvironment, bucketMap?: Storage.BucketMap);
    readonly env: StorageFileEnvironment;
    load(blob: Storage.StorageBlob): void;
    save(blob: Storage.StorageBlob): void;
    del(blob: Storage.StorageBlob): void;
}
