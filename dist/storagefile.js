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
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./lib/all.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./lib/all.ts":
/*!********************!*\
  !*** ./lib/all.ts ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./file */ "./lib/file.ts"));


/***/ }),

/***/ "./lib/file.ts":
/*!*********************!*\
  !*** ./lib/file.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Node libraries
const fs = __webpack_require__(/*! fs */ "fs");
const Storage = __webpack_require__(/*! @dra2020/storage */ "@dra2020/storage");
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
}
exports.StorageManager = StorageManager;


/***/ }),

/***/ "@dra2020/logabstract":
/*!***************************************!*\
  !*** external "@dra2020/logabstract" ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@dra2020/logabstract");

/***/ }),

/***/ "@dra2020/storage":
/*!***********************************!*\
  !*** external "@dra2020/storage" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@dra2020/storage");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ })

/******/ });
});
//# sourceMappingURL=storagefile.js.map