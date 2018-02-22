/**
 * Created by wuxiangan on 2016/12/20.
 */

define([
    'jquery',
    'markdown-it',
    "js-base32",
    "helper/errTranslate"
], function ($, markdown_it, jsbase32, errTranslate) {
    var util = {
        stack      : [], // 堆栈操作模拟
        id         : 0,  // ID产生器 局部唯一性
        lastUrlObj : {}, // 记录最近一次URL信息
        urlRegex   : /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/,
    };

    util.subMarkdownRender = (function() {
        var md = new markdown_it({
            html: true,
            langPrefix: 'code-'
        });
        return function(text) {
            return md.render(text);
        }
    })();

    util.setImgBackground = (function(){
        var background = {
            "background-size"     : "cover",
            "background-position" : "center center",
        };

        return function(text){
            background['background-image'] = 'url(' + text + ')';
            return background;
        }
    })();

    util.getId = function () {
        this.id = this.id > 1000000 ? 0 : this.id+1;
        return this.id;
    }

	// 发送视图内容加载完成通知
	util.broadcastViewContentLoaded = function(params, $scope) {
        $scope = $scope || util.angularServices.$rootScope;
		
		$scope.$broadcast("selfViewContentLoaded", params);
	}

	// 监听视图内容加载完成回调
	util.onViewContentLoaded = function(cb, $scope) {
        $scope = $scope || util.angularServices.$rootScope;
		
		$scope.$on("selfViewContentLoaded",function(event, data){
			cb && cb(data);
		});
	}

	util.onViewContentLoadedByContainerId = function(containerId, cb, $scope) {
        $scope = $scope || util.angularServices.$rootScope;
		
		$scope.$on("selfViewContentLoaded",function(event, data){
			if (data && data.containerId == containerId) {
				cb && cb(data);
			}
		});

	}

    util.html = function(selector, htmlStr, $scope, isCompile) {
        isCompile = isCompile == undefined ? true : isCompile;
        htmlStr   = htmlStr ||'<div></div>';
        $scope    = $scope || util.angularServices.$rootScope;

        if (isCompile) {
            let $compile = util.angularServices.$compile;
            htmlStr = $compile(htmlStr)($scope);
        }

        $(selector).html(htmlStr);

		util.broadcastViewContentLoaded({containerId : selector}, $scope);

        setTimeout(function () {
            $scope.$apply();
        });
    }

    util.compile = function (htmlStr, $scope) {
        var $compile = util.angularServices.$compile;

        $scope  = $scope || util.angularServices.$rootScope;
        htmlStr = $compile(htmlStr||'<div></div>')($scope);
        
        return htmlStr;
    }

    util.$apply = function ($scope) {
        $scope = $scope || util.angularServices.$rootScope;
        setTimeout(function () {
            $scope.$apply();
        });
    }

    // 将字符串url解析成{sitename, pagename}对象
    util.parseUrl = function () {
        let hostname = config.hostname;
        let pathname = config.pathname;

        if(config.islocalWinEnv()) {
            pathname = config.hash ? config.hash.substring(1) : '/';

            if (pathname.indexOf('?') >= 0) {
                pathname = pathname.substring(0, pathname.indexOf('?'));
            }
            /*
            var $location = util.getAngularServices().$location;
            if ($location) {
                pathname = $location.path();
            } else {
                pathname = window.location.hash ? window.location.hash.substring(1) : '/';
            }
            */
        }

        pathname = decodeURI(pathname);

        let username = config.isOfficialDomain(hostname) ? undefined : hostname.match(/([\w-]+)\.[\w]+\.[\w]+/);
        let sitename = '';
        let pagename = '';
        let pagepath = '';
        let domain   = '';

        // 排除IP访问
        if (hostname.split(':')[0].match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
            username = undefined;
        }

        let paths = pathname.split('/');
        username  = username && username[1];
        
        if (username && username.indexOf("-") > 0) {
			// 用户页
            let splitIndex = username.indexOf('-');

            if (splitIndex > 0) {
                sitename = username.substring(splitIndex + 1);
                username = username.substring(0, splitIndex);
                pagename = paths.length > 1 ? paths[paths.length-1] : undefined;
				username = username.toLowerCase();
				sitename = sitename.toLowerCase();
                pagepath = '/' + username + '/' + sitename + pathname;
            } else {
                sitename = paths.length > 1 ? paths[1] : undefined;
                pagename = paths.length > 2 ? paths[paths.length-1] : undefined;
				username = username.toLowerCase();
				if (sitename) {
					sitename = sitename.toLowerCase();
					pagepath = '/' + username + '/' + sitename + '/' + pathname.substring(sitename.length+2);
				}
            }
        } else {
            username = paths.length > 1 ? paths[1] : undefined;
            sitename = paths.length > 2 ? paths[2] : undefined;
            pagename = paths.length > 3 ? paths[paths.length - 1] : undefined;

			if (username != "wiki") {
                username = username.toLowerCase();
                
				if (sitename) {
					sitename = sitename.toLowerCase();
					pagepath = '/' + username + '/' + sitename + '/' + pathname.substring((username+sitename).length+3);
				}
			}
        }

        if (username != "wiki" && !pagename) {
            pagename = "index";
            pagepath += (pagepath[pagepath.length - 1] == "/" ? "" : "/") + pagename;
        }

        domain = hostname;

        return {
			domain   : domain, 
			username : username, 
			sitename : sitename, 
			pagename : pagename, 
			pathname : pathname, 
			pagepath : pagepath
		};
    }

    util.setLastUrlObj = function (urlObj) {
        this.lastUrlObj = urlObj;
    }

    util.getLastUrlObj = function () {
        return this.lastUrlObj;
    }

    util.setAngularServices = function(angularServices) {
        this.angularServices = angularServices;
    }

    util.getAngularServices = function() {
        return this.angularServices;
    }

    util.setSelfServices = function (selfServices) {
        this.selfServices = selfServices;
    }

    util.getSelfServices = function () {
        return this.selfServices;
    }

    util.setScope = function ($scope) {
        this.angularServices.$scope = $scope;
    }

    util.getScope = function () {
        return this.angularServices.$scope;
    }

    util.setParams = function (params) {
        this.params = params;
    }

    util.getParams = function () {
        return this.params;
    }

    util.setFunction = function (func) {
        this.func = func;
    }

    util.getFunction = function () {
        return this.func;
    }

    util.push = function (obj) {
        this.stack.push(obj);
    }

    util.arrayFrom = function(obj) {
        if(Array.isArray(obj)) return obj;
        var result = [];
        for(var i in obj) result[i] = obj[i];
        return result;
    }

    //get the first available number from number list
    util.getFirstAvailableNumber = function(numbers) {
        var list = Array.isArray(numbers) ? numbers : arguments;
        for(var i in list) {
            //if list[i] looks like a number, '1', 1, 0, '.3'
            if (+list[i] == list[i] && list[i]!=='' && typeof list[i] !== 'boolean') {
                return +list[i]
            }
        }
        return 0;
    }

    util.pop = function () {
        return this.stack.pop();
    }

    util.stringTrim = function (str) {
        return str ? str.replace(/(^\s*)|(\s*$)/g,'') : str;
    }

    util.getCurrentDateString = function () {
        var date = new Date();
        return date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    }

    util.isFunction = function (func) {
        return func && typeof(func) == "function";
    }

	util.ajax = function(obj) {
		$.ajax({
			url:obj.url,
			type:obj.type || "GET",
			dataType:obj.dataType || "json",
			//contentType:"application/json;charset=UTF-8",
			data:obj.data,
			beforeSend:obj.beforeSend,
			success:function(result, statu, xhr) {
				obj.success && obj.success(result, statu, xhr);
			},
			error:function(xhr, statu, error) {
				obj.error && obj.error(xhr, statu, error);
			}
		});
	}

	util.$http = function(obj) {
		if (!obj.method || !obj.url) {
			obj.errorCallback && obj.errorCallback();
			return;
		}

        var $http = this.angularServices.$http;
		var config = obj.config || {};
		var callback = obj.callback;
		var errorCallback = obj.errorCallback;

		config.method = obj.method;
		config.url = obj.url;
		config.cache = obj.cache;
		config.isShowLoading = obj.isShowLoading;
		config.withCredentials = obj.withCredentials;

        // 在此带上认证参数
        if (obj.method == 'POST') {
			config.data = obj.params;
        } else {
			config.params = obj.params;
        }

        $http(config).then(function (response) {
            var data = response.data;
            //console.log(data);
            // debug use by wxa
            if (!data || !data.error) {
                // console.log(obj.url, data);
                errorCallback && errorCallback(data);
				return;
            }
            if (data.error.id == 0) {
                //console.log(data.data);
                callback && callback(data.data);
            } else {
                // console.log(obj.url, data);
                data.error && (data.error.message = errTranslate(data.error.message));
                errorCallback && errorCallback(data.error);
            }
            //Loading.hideLoading();
        }).catch(function (response) {
            // console.log(response);
            //Loading.hideLoading();
            // 网络错误
            errorCallback && errorCallback( errTranslate(response.data) );
        });

	}

    util.http = function(method, url, params, callback, errorCallback, isShowLoading) {
		util.$http({
			method:method,
			url:url,
			params:params,
			isShowLoading:isShowLoading == undefined ? true : isShowLoading,
			callback:callback,
			errorCallback:errorCallback,
		});
	}

    util.post = function (url, params, callback, errorCallback, isShowLoading) {
        this.http("POST", url, params, callback, errorCallback, isShowLoading);
    }

    util.get = function (url, params, callback, errorCallback, isShowLoading) {
        this.http("GET", url, params, callback, errorCallback, isShowLoading);
    }

	util.getByCache = function (url, params, callback, errorCallback, isShowLoading) {
		util.$http({
			method:"GET",
			url:url,
			params:params,
			cache:true,
			isShowLoading:isShowLoading,
			callback:callback,
			errorCallback:errorCallback,
		});
    }

    util.pagination = function (page, params, pageCount) {
        params.page = params.page || 0;
        page = page || 1;
        pageCount = pageCount || 1000000; // 页总数设置无线大

        if (params.page == page || page < 1 || page > pageCount) {
            return false;              // 不翻页
        }
        params.page = page;

        return true;
    }

    util.goUserSite = function (url, isOpen) {
        url = "http://" + config.apiHost + url;
        if (isOpen) {
            window.open(url);
        } else {
            window.location.href = url;
        }
    }

    // 跳转
    util.go = function (url, isOpen) {
        if (url[0] != '/' && url.indexOf('://') < 0) {
            url = "/wiki/" + url;
        }
		
		var argIndex = url.indexOf("?");
		
		if (argIndex > 0 ) {
			url = util.humpToSnake(url.substring(0, argIndex)) + url.substring(argIndex);
		} else {
			url = util.humpToSnake(url);
		}

        if (config.islocalWinEnv()) {
            url = config.frontEndRouteUrl + '#' + url;
        } else if (url.indexOf('://') < 0){
            url = "http://" + config.apiHost + url;
        }

        if (isOpen) {
            window.open(url);
        } else {
            window.location.href = url;
        }
    }

    // 跳转至mod页
    util.goMod = function (path, isOpen) {
        path = util.humpToSnake(path);
        util.go("/wiki/js/mod/" + path, isOpen);
    }

    util.isOfficialPage = function () {
        var urlObj = util.parseUrl();
        var pathname = urlObj.pathname;
        var domain = urlObj.domain;
        if (config.isOfficialDomain(domain) && (pathname.indexOf('/wiki/') == 0 || pathname == '/' || pathname.split("/").length < 3 )) {
            return true;
        }
        return false;
    }

    // 是否是编辑器页
    util.isEditorPage = function () {
        let pathname = util.parseUrl().pathname;

        if (pathname == "/wiki/wikieditor") {
            return true;
        }
        
        return false;
    }

    // 执行批量  function(finishCB){}
    util.batchRun = function(fnList,finish) {
		if (!fnList || fnList.length == 0) {
			finish && finish();
			return;
		}

        var isCall = [];
        var _isFinish = function () {
            if (isCall.length != fnList.length)
                return false;

            for (var i = 0; i < isCall.length; i++) {
                if (!isCall[i])
                    return false;
            }

            finish && finish();
            return true;
        }

        var _finish = function (index) {
            isCall[index] = true;
            _isFinish();
        }

        for (var i = 0; i < fnList.length; i++) {
            isCall.push(false);
            (function (index) {
                fnList[index] && (fnList[index])(function () {
                    _finish(index);
                });
            })(i);
        }
    }

    // 顺序执行 function(cb,errcb){}
    util.sequenceRun = function (fnList, delay, cb, errcb) {
		if (!fnList || fnList.length == 0) {
			cb && cb();
			return;
		}
        delay = delay == undefined ? 1000 : delay;
        var index = 0;
        var retryCount = {};
        var _sequenceRun = function () {
            if (fnList.length <= index) {
                cb && cb();
                return;
            }
            var indexStr = "retry_" + index;
            // 失败次数过多
            if (retryCount[indexStr] && retryCount[indexStr]> 3) {
                errcb && errcb();
                return;
            }

            var fn = fnList[index];
            fn && fn(function () {
                index++;
                _sequenceRun();
                //setTimeout(_sequenceRun,delay);
            }, function () {
                retryCount[indexStr] = retryCount[indexStr] ? (retryCount[indexStr] +1) : 1;
                setTimeout(_sequenceRun,delay);
            });
        };

        _sequenceRun();
    };

    // 书写格式转换，下划线转驼峰
    util.snakeToHump = function (str) {
        if (!str) {
            return str;
        }

        var wordsList = str.split('_');
        var resultStr = wordsList[0];

        for (var i = 1; i < wordsList.length; i++) {
            var word = wordsList[i];

            if (word[0] >= 'a' && word[0] <= 'z') {
                resultStr += word[0].toUpperCase() + word.substring(1);
            } else {
                resultStr += word;
            }
        }

        return resultStr;
    }

    // 书写格式转换，驼峰转下划线
    util.humpToSnake = function (str) {
        if (!str) {
            return str;
        }

        var resultStr = "";

        for (var i = 0; i < str.length; i++) {
            if (str[i] >= "A" && str[i] <= "Z") {
                resultStr += '_' + str[i].toLowerCase();
            } else {
                resultStr += str[i];
            }
        }

        return resultStr;
    }

	// 获取当前路径
	util.getPathname = function() {
		return util.humpToSnake(util.parseUrl().pathname);
	}

	// 获取查询参数
	util.getQueryObject = function(search, decode) {
		decode = decode == undefined ? true : decode;
		search = search || window.location.search.substring(1);
		var result = {};
		var argList = search.split("&");
		for (var i = 0; i < argList.length; i++) {
			var key_value = argList[i].split("=");
			if (key_value.length > 0) {
				result[key_value[0]] = key_value[1] || "";
				if (decode) {
					// console.log(result[key_value[0]]);
					result[key_value[0]] = decodeURIComponent(result[key_value[0]]);
				}
			}
		}

		return result;
	}

	// 根据obj获取查询串
	util.getQueryString = function(searchObj, encode) {
		var search = "";
		var value = undefined;
		encode = encode == undefined ? true : encode;
		searchObj = searchObj || {};
		for (key in searchObj) {
			//if (typeof(searchObj[key]) == "object") {
				//value = this.getQueryString(searchObj[key], encode);
			//} else {
				//value = encode ? encodeURIComponent(searchObj[key]) : searchObj[key];
			//}
			value = encode ? encodeURIComponent(searchObj[key]) : searchObj[key];
			if (search.length == 0) {
				search += key + "=" + value;
			} else {
				search += "&" + key + "=" + value;
			}
		}

		return search;
	}

	// 判断对象是否为空
	util.isEmptyObject = function(obj) {
		for (var key in (obj || {})) {
			return false;
        }
        
		return true;
	}

	util.base32Encode = function(str) {
		return base32.encode(str);
	}

	util.base32Decode = function(str) {
		return base32.decode(str);
	}

    /** 
     * @param {Object} date 当前时间，Sun Feb 11 2018 10:38:15 GMT+0800 (中国标准时间)
     * @param {String} joinStr 可选，year、month、day之间的连字符，默认为"-"
     * @return {String} year + "joinStr" + month + "joinStr" + day
    */
    util.formatDate = function(date, joinStr){
        date = date || new Date();
        joinStr = joinStr || "-";
        var month = "" + (date.getMonth() + 1),
            day = "" + date.getDate(),
            year = date.getFullYear();
        month = (month.length < 2) ? ("0" + month) : month;
        day = (day.length < 2) ? ("0" + day) : day;
        return [year, month, day].join(joinStr);
    }

    /**
     * Mixins for ES5
     */
    util.mixin = (function(){
        function mixin(source, target) {  
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            }
        }

        return function(source, target){
            mixin(source, target);
        }
    })();

    util.throttle = function (method, context) {
        clearTimeout(method.stickTimer);

        method.stickTimer = setTimeout(function () {
            method.call(context);
        }, 100);
    }

    config.util = util;

    return util;
});
