import * as Storage from '@terrencecrowley/storage';
export declare class FileStorageManager extends Storage.StorageManager {
    bStarting: boolean;
    bFailedStart: boolean;
    totalOps: number;
    outstandingOps: number;
    constructor();
    load(blob: Storage.StorageBlob): void;
    save(blob: Storage.StorageBlob): void;
    del(blob: Storage.StorageBlob): void;
}
