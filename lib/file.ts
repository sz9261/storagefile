// Node libraries
import * as fs from 'fs';

// Shared libraries
import * as Context from '@terrencecrowley/context';
import * as Storage from '@terrencecrowley/storage';
import * as Log from '@terrencecrowley/log';

Context.setDefaults({ DebugSaveDelay: 0, DebugLoadDelay: 0, DebugDelDelay: 0 });

class FileRequest implements Storage.BlobRequest
{
  blob: Storage.StorageBlob;
  data: string;
  err: any;

  constructor(blob: Storage.StorageBlob)
    {
      this.blob = blob;
      this.data = null;
      this.err = null;
    }

  result(): number
    {
      if (this.data == null && this.err == null)
        return Storage.EPending;
      else if (this.err)
        return Storage.EFail;
      else
        return Storage.ESuccess;
    }

  asString(): string
    {
      if (this.data == null || this.err != null)
        return undefined;
      return this.data;
    }

  asError(): string
    {
      if (this.err)
        return JSON.stringify(this.err);
      return undefined;
    }

  continuationToken(): string
    {
      return null;
    }
}

export class StorageManager extends Storage.StorageManager
{
  bStarting: boolean;
  bFailedStart: boolean;
  totalOps: number;
  outstandingOps: number;

  constructor()
    {
      super();

      this.totalOps = 0;
      this.outstandingOps = 0;
      this.bStarting = true;
      this.bFailedStart = false;

      Log.event('Storage: operating against file system');

      let sm = this;

      fs.mkdir('state', 0o777, (err: any) => {
        if (err == null || err.code == 'EEXIST')
        {
          sm.bStarting = false;
          sm.bFailedStart = false;
        }
        else
        {
          Log.error(`Storage Manager startup failed: ${err}`);
          sm.bStarting = false;
          sm.bFailedStart = true;
        }
      });
    }

  load(blob: Storage.StorageBlob): void
    {
      if (blob.id == '')
      {
        Log.error('storagefile: blob load called with empty key');
        Log.error('storagefile: blob load called with empty key');
        return;
      }

      let fm = this;
      fm.totalOps++;
      fm.outstandingOps++;
      let id: string = `load+${blob.id}+${this.totalOps}`;

      Log.event('storagefile: load start');

      let trace = new Log.AsyncTimer('storagefile: load');
      let fname: string = 'state/' + blob.id;
      let rq: FileRequest = new FileRequest(blob);
      this.loadBlobIndex[id] = rq;
      blob.setLoading();
      fs.readFile(fname, 'utf8', (err: any, data: string) => {
          setTimeout( () => {
            if (err)
              rq.err = err;
            else
              rq.data = data;

            blob.setLoaded(rq.result());
            blob.endLoad(rq);
            this.emit('load', blob);
            
            fm.outstandingOps--;
            delete fm.loadBlobIndex[id];

            Log.event('load end');
            trace.log();
          }, Context.xnumber('DebugLoadDelay'));
        });
    }

  save(blob: Storage.StorageBlob): void
    {
      if (blob.id == '')
      {
        Log.error('storagefile: blob save called with empty key');
        return;
      }
      let fm = this;
      fm.totalOps++;
      fm.outstandingOps++;
      let id: string = `save+${blob.id}+${this.totalOps}`;

      Log.event('storagefile: save start');

      let trace = new Log.AsyncTimer('storagefile: save');
      let fname: string = 'state/' + blob.id;
      let rq: FileRequest = new FileRequest(blob);
      this.saveBlobIndex[id] = rq;
      blob.setSaving();
      fs.writeFile(fname, blob.asString(), 'utf8', (err: any) => {
          setTimeout( () => {
            if (err)
              rq.err = '';
            else
              rq.data = '';

            blob.setSaved(rq.result());
            blob.endSave(rq);
            this.emit('save', blob);

            fm.outstandingOps--;
            delete fm.saveBlobIndex[id];

            Log.event('storagefile: save end');
            trace.log();
          }, Context.xnumber('DebugSaveDelay'));
        });
    }

  del(blob: Storage.StorageBlob): void
    {
      if (blob.id == '')
      {
        Log.error('storagefile: blob delete called with empty key');
        return;
      }
      let fm = this;
      fm.totalOps++;
      fm.outstandingOps++;
      let id: string = `delete+${blob.id}+${this.totalOps}`;

      Log.event(`storagefile: del start`);

      let trace = new Log.AsyncTimer('storagefile: del');
      let fname: string = 'state/' + blob.id;
      let rq: FileRequest = new FileRequest(blob);
      this.delBlobIndex[id] = rq;
      blob.setDeleting();
      fs.unlink(fname, (err: any) => {
          setTimeout( () => {
            if (err)
              rq.err = err;
            else
              rq.data = '';

            blob.endDelete(rq);
            this.emit('del', blob);

            fm.outstandingOps--;
            delete fm.delBlobIndex[id];

            Log.event('storagefile: del end');
            trace.log();
          }, Context.xnumber('DebugDelDelay'));
        });
    }
}
