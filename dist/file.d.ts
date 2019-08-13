import * as Context from '@dra2020/context';
import * as Storage from '@dra2020/storage';
import * as FSM from '@dra2020/fsm';
import * as LogAbstract from '@dra2020/logabstract';
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
