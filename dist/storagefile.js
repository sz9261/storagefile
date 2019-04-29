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
// Shared libraries
const Context = __webpack_require__(/*! @terrencecrowley/context */ "@terrencecrowley/context");
const Storage = __webpack_require__(/*! @terrencecrowley/storage */ "@terrencecrowley/storage");
const Log = __webpack_require__(/*! @terrencecrowley/log */ "@terrencecrowley/log");
Context.setDefaults({ DebugSaveDelay: 0, DebugLoadDelay: 0, DebugDelDelay: 0 });
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
            return Storage.EFail;
        else
            return Storage.ESuccess;
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
    continuationToken() {
        return null;
    }
}
class StorageManager extends Storage.StorageManager {
    constructor() {
        super();
        this.totalOps = 0;
        this.outstandingOps = 0;
        this.bStarting = true;
        this.bFailedStart = false;
        Log.event('Storage: operating against file system');
        let sm = this;
        fs.mkdir('state', 0o777, (err) => {
            if (err == null || err.code == 'EEXIST') {
                sm.bStarting = false;
                sm.bFailedStart = false;
            }
            else {
                Log.error(`Storage Manager startup failed: ${err}`);
                sm.bStarting = false;
                sm.bFailedStart = true;
            }
        });
    }
    load(blob) {
        if (blob.id == '') {
            Log.error('storagefile: blob load called with empty key');
            Log.error('storagefile: blob load called with empty key');
            return;
        }
        let fm = this;
        fm.totalOps++;
        fm.outstandingOps++;
        let id = `load+${blob.id}+${this.totalOps}`;
        Log.event('storagefile: load start');
        let trace = new Log.AsyncTimer('storagefile: load');
        let fname = 'state/' + blob.id;
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
                Log.event('load end');
                trace.log();
            }, Context.xnumber('DebugLoadDelay'));
        });
    }
    save(blob) {
        if (blob.id == '') {
            Log.error('storagefile: blob save called with empty key');
            return;
        }
        let fm = this;
        fm.totalOps++;
        fm.outstandingOps++;
        let id = `save+${blob.id}+${this.totalOps}`;
        Log.event('storagefile: save start');
        let trace = new Log.AsyncTimer('storagefile: save');
        let fname = 'state/' + blob.id;
        let rq = new FileRequest(blob);
        this.saveBlobIndex[id] = rq;
        blob.setSaving();
        fs.writeFile(fname, blob.asString(), 'utf8', (err) => {
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
                Log.event('storagefile: save end');
                trace.log();
            }, Context.xnumber('DebugSaveDelay'));
        });
    }
    del(blob) {
        if (blob.id == '') {
            Log.error('storagefile: blob delete called with empty key');
            return;
        }
        let fm = this;
        fm.totalOps++;
        fm.outstandingOps++;
        let id = `delete+${blob.id}+${this.totalOps}`;
        Log.event(`storagefile: del start`);
        let trace = new Log.AsyncTimer('storagefile: del');
        let fname = 'state/' + blob.id;
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
                Log.event('storagefile: del end');
                trace.log();
            }, Context.xnumber('DebugDelDelay'));
        });
    }
}
exports.StorageManager = StorageManager;


/***/ }),

/***/ "@terrencecrowley/context":
/*!*******************************************!*\
  !*** external "@terrencecrowley/context" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@terrencecrowley/context");

/***/ }),

/***/ "@terrencecrowley/log":
/*!***************************************!*\
  !*** external "@terrencecrowley/log" ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@terrencecrowley/log");

/***/ }),

/***/ "@terrencecrowley/storage":
/*!*******************************************!*\
  !*** external "@terrencecrowley/storage" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@terrencecrowley/storage");

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