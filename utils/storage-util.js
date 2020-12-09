const EXPIRE_THRESHOLD_TIME = (PRODUCTION ? 240 : 240) * 60 * 1000
import _get from 'lodash/get'	//lodash处理,可直接用js
import _isFunction from 'lodash/isFunction'
import _isNumber from 'lodash/isNumber'

const getItem = function(key) {
    var storage = window.localStorage;
    if (storage) {
        var value = storage.getItem(key);
        return value && JSON.parse(value);
    }
    return null;
};

const addItem = function(key, value) {
    var storage = window.localStorage;
    if (storage) {
        storage.setItem(key, JSON.stringify({
            value,
            LS_TS: +new Date()
        }));
    }
};

const removeItem = function(key) {
    var storage = window.localStorage;
    if (storage) {
        storage.removeItem(key);
    }
};

const getItemValue = function(key) {
    return _get(getItem(key), 'value')
};

const getItemTS = function(key) {
    return _get(getItem(key), 'LS_TS')
};

const clearStorage = function() {
    var storage = window.localStorage;
    if (storage) {
        storage.clear();
    }
};

//检查登陆状态是否过期
//使用localStorage保持会话，如果浏览器不支持该API，该系统的vue-router则会出现反复登录的死循环bug
const checkItemExpire = function(key, cb) {
    if (_isNumber(getItemTS(key)) && ((+new Date()) - getItemTS(key)) > EXPIRE_THRESHOLD_TIME) {
        removeItem(key)
        if (_isFunction(cb)) {
            cb()
        }
        return true
    }
    return false
}
export {
    getItem,
    addItem,
    removeItem,
    getItemValue,
    getItemTS,
	clearStorage,
    checkItemExpire
}
