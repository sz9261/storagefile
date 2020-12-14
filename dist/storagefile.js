(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["storagefile"] = factory();
	else
		root["storagefile"] = factory();
})(global, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/all.ts":
/*!********************!*\
  !*** ./lib/all.ts ***!
  \********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./file */ "./lib/file.ts"), exports);


/***/ }),

/***/ "./lib/file.ts":
/*!*********************!*\
  !*** ./lib/file.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StorageManager = void 0;
// Node libraries
const fs = __webpack_require__(/*! fs */ "fs");
const Storage = __webpack_require__(/*! @dra2020/storage */ "@dra2020/storage");
const FSM = __webpack_require__(/*! @dra2020/fsm */ "@dra2020/fsm");
const LogAbstract = __webpack_require__(/*! @dra2020/logabstract */ "@dra2020/logabstract");
const StorageFileContextDefaults = { DebugSaveDelay: 0, DebugLoadDelay: 0, DebugDelDelay: 0 };
class FileRequest {
    constructor(blob) {
        this.blob = blob;
        this.data = null;
        this.err = null;
    }
    result() {
        if (this.data == null && this.err == null)
            return Storage.EPending;
        else if (this.err)
            return (this.err.code && this.err.code === 'ENOENT') ? Storage.ENotFound : Storage.EFail;
        else
            return Storage.ESuccess;
    }
    asBuffer() {
        if (this.data && this.err == null)
            return Buffer.from(this.data);
        return undefined;
    }
    asUncompressedBuffer() {
        return this.asBuffer();
    }
    asString() {
        if (this.data == null || this.err != null)
            return undefined;
        return this.data;
    }
    asError() {
        if (this.err)
            return JSON.stringify(this.err);
        return undefined;
    }
    asArray() {
        return null;
    }
    asProps() {
        return null;
    }
    continuationToken() {
        return null;
    }
}
class StorageManager extends Storage.StorageManager {
    constructor(env, bucketMap) {
        super(env, bucketMap);
        this.totalOps = 0;
        this.outstandingOps = 0;
        this.onInitDir = this.onInitDir.bind(this);
        this.env.log.event('Storage: operating against file system');
        this.nStartPending = 1;
        fs.mkdir('state', 0o777, (err) => {
            if (err == null || err.code == 'EEXIST') {
                this.nStartPending--;
                this.initDir('state/default');
                this.initDir('state/production');
                this.initDir('state/development');
                this.initDir('state/logs');
                this.initDir('state/downloads');
                this.initDir('state/memsqs');
            }
            else {
                this.env.log.error(`Storage Manager startup failed: ${err}`);
                this.nStartPending = -1;
            }
        });
    }
    get env() { return this._env; }
    initDir(dir) {
        this.nStartPending++;
        fs.mkdir(dir, 0o777, this.onInitDir);
    }
    onInitDir(err) {
        if (err == null || err.code == 'EEXIST') {
            this.nStartPending--;
        }
        else {
            this.env.log.error(`Storage Manager startup initialization failed: ${err}`);
            this.nStartPending = -1;
        }
    }
    load(blob) {
        if (blob.id == '') {
            this.env.log.error('storagefile: blob load called with empty key');
            this.env.log.error('storagefile: blob load called with empty key');
            return;
        }
        let fm = this;
        fm.totalOps++;
        fm.outstandingOps++;
        let id = `load+${blob.id}+${this.totalOps}`;
        this.env.log.event('storagefile: load start');
        let trace = new LogAbstract.AsyncTimer(this.env.log, 'storagefile: load');
        let fname = 'state/' + blob.bucketName + '/' + blob.id;
        let rq = new FileRequest(blob);
        this.loadBlobIndex[id] = rq;
        blob.setLoading();
        fs.readFile(fname, 'utf8', (err, data) => {
            setTimeout(() => {
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
    save(blob) {
        if (blob.id == '') {
            this.env.log.error('storagefile: blob save called with empty key');
            return;
        }
        let fm = this;
        fm.totalOps++;
        fm.outstandingOps++;
        let id = `save+${blob.id}+${this.totalOps}`;
        this.env.log.event('storagefile: save start');
        let trace = new LogAbstract.AsyncTimer(this.env.log, 'storagefile: save');
        let fname = 'state/' + blob.bucketName + '/' + blob.id;
        let rq = new FileRequest(blob);
        this.saveBlobIndex[id] = rq;
        blob.setSaving();
        let b;
        let f = blob.asFile();
        if (f)
            b = fs.readFileSync(f);
        else
            b = blob.asBuffer();
        fs.writeFile(fname, b ? b : blob.asString(), (err) => {
            setTimeout(() => {
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
    del(blob) {
        if (blob.id == '') {
            this.env.log.error('storagefile: blob delete called with empty key');
            return;
        }
        let fm = this;
        fm.totalOps++;
        fm.outstandingOps++;
        let id = `delete+${blob.id}+${this.totalOps}`;
        this.env.log.event(`storagefile: del start`);
        let trace = new LogAbstract.AsyncTimer(this.env.log, 'storagefile: del');
        let fname = 'state/' + blob.bucketName + '/' + blob.id;
        let rq = new FileRequest(blob);
        this.delBlobIndex[id] = rq;
        blob.setDeleting();
        fs.unlink(fname, (err) => {
            setTimeout(() => {
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
    createTransferUrl(params) {
        let fsm = new Storage.FsmTransferUrl(this.env, 'transfers', params);
        fsm.url = `/api/sessions/transfers/${fsm.key}`;
        fsm.setState(FSM.FSM_DONE);
        return fsm;
    }
}
exports.StorageManager = StorageManager;


/***/ }),

/***/ "@dra2020/fsm":
/*!*******************************!*\
  !*** external "@dra2020/fsm" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@dra2020/fsm");;

/***/ }),

/***/ "@dra2020/logabstract":
/*!***************************************!*\
  !*** external "@dra2020/logabstract" ***!
  \***************************************/
/***/ ((module) => {

module.exports = require("@dra2020/logabstract");;

/***/ }),

/***/ "@dra2020/storage":
/*!***********************************!*\
  !*** external "@dra2020/storage" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("@dra2020/storage");;

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__("./lib/all.ts");
/******/ })()
;
});
//# sourceMappingURL=storagefile.js.map