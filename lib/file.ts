// Node libraries
import * as fs from 'fs';

// Shared libraries
import * as Context from '@dra2020/context';
import * as Storage from '@dra2020/storage';
import * as FSM from '@dra2020/fsm';
import * as LogAbstract from '@dra2020/logabstract';

const StorageFileContextDefaults: Context.ContextValues = { DebugSaveDelay: 0, DebugLoadDelay: 0, DebugDelDelay: 0 };

export interface StorageFileEnvironment
{
  context: Context.IContext;
  log: LogAbstract.ILog;
  fsmManager: FSM.FsmManager;
}

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
        return (this.err.code && this.err.code === 'ENOENT') ? Storage.ENotFound : Storage.EFail;
      else
        return Storage.ESuccess;
    }

  asBuffer(): Buffer
    {
      if (this.data && this.err == null)
        return Buffer.from(this.data);
      return undefined;
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

  asArray(): string[]
    {
      return null;
    }

  asProps(): Storage.BlobProperties[]
    {
      return null;
    }

  continuationToken(): string
    {
      return null;
    }
}

export class StorageManager extends Storage.StorageManager
{
  nStartPending: number;
  totalOps: number;
  outstandingOps: number;

  constructor(env: StorageFileEnvironment, bucketMap?: Storage.BucketMap)
    {
      super(env, bucketMap);

      this.totalOps = 0;
      this.outstandingOps = 0;
      this.onInitDir = this.onInitDir.bind(this);

      this.env.log.event('Storage: operating against file system');

      this.nStartPending = 1;
      fs.mkdir('state', 0o777, (err: any) => {
        if (err == null || err.code == 'EEXIST')
        {
          this.nStartPending--;
          this.initDir('state/default');
          this.initDir('state/production');
          this.initDir('state/development');
          this.initDir('state/logs');
          this.initDir('state/downloads');
          this.initDir('state/memsqs');
        }
        else
        {
          this.env.log.error(`Storage Manager startup failed: ${err}`);
          this.nStartPending = -1;
        }
      });
    }

  get env(): StorageFileEnvironment { return this._env as StorageFileEnvironment; }

  initDir(dir: string): void
  {
    this.nStartPending++;
    fs.mkdir(dir, 0o777, this.onInitDir);
  }

  onInitDir(err: any): void
  {
    if (err == null || err.code == 'EEXIST')
    {
      this.nStartPending--;
    }
    else
    {
      this.env.log.error(`Storage Manager startup initialization failed: ${err}`);
      this.nStartPending = -1;
    }
  }

  load(blob: Storage.StorageBlob): void
    {
      if (blob.id == '')
      {
        this.env.log.error('storagefile: blob load called with empty key');
        this.env.log.error('storagefile: blob load called with empty key');
        return;
      }

      let fm = this;
      fm.totalOps++;
      fm.outstandingOps++;
      let id: string = `load+${blob.id}+${this.totalOps}`;

      this.env.log.event('storagefile: load start');

      let trace = new LogAbstract.AsyncTimer(this.env.log, 'storagefile: load');
      let fname: string = 'state/' + blob.bucketName + '/' + blob.id;
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

            this.env.log.event('load end');
            trace.log();
          }, this.env.context.xnumber('DebugLoadDelay'));
        });
    }

  save(blob: Storage.StorageBlob): void
    {
      if (blob.id == '')
      {
        this.env.log.error('storagefile: blob save called with empty key');
        return;
      }
      let fm = this;
      fm.totalOps++;
      fm.outstandingOps++;
      let id: string = `save+${blob.id}+${this.totalOps}`;

      this.env.log.event('storagefile: save start');

      let trace = new LogAbstract.AsyncTimer(this.env.log, 'storagefile: save');
      let fname: string = 'state/' + blob.bucketName + '/' + blob.id;
      let rq: FileRequest = new FileRequest(blob);
      this.saveBlobIndex[id] = rq;
      blob.setSaving();
      let b: Buffer;
      let f = blob.asFile();
      if (f)
        b = fs.readFileSync(f);
      else
        b = blob.asBuffer();
      fs.writeFile(fname, b ? b : blob.asString(), (err: any) => {
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

            this.env.log.event('storagefile: save end');
            trace.log();
          }, this.env.context.xnumber('DebugSaveDelay'));
        });
    }

  del(blob: Storage.StorageBlob): void
    {
      if (blob.id == '')
      {
        this.env.log.error('storagefile: blob delete called with empty key');
        return;
      }
      let fm = this;
      fm.totalOps++;
      fm.outstandingOps++;
      let id: string = `delete+${blob.id}+${this.totalOps}`;

      this.env.log.event(`storagefile: del start`);

      let trace = new LogAbstract.AsyncTimer(this.env.log, 'storagefile: del');
      let fname: string = 'state/' + blob.bucketName + '/' + blob.id;
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

            this.env.log.event('storagefile: del end');
            trace.log();
          }, this.env.context.xnumber('DebugDelDelay'));
        });
    }

  createTransferUrl(op: Storage.TransferUrlOp): Storage.FsmTransferUrl
  {
    let fsm = new Storage.FsmTransferUrl(this.env, 'transfers', op);
    fsm.url = `/api/sessions/transfers/${fsm.key}`;
    fsm.setState(FSM.FSM_DONE);
    return fsm;
  }
}
