/**
 * angular-oauth2 - Angular OAuth2
 * @version v3.0.2
 * @link https://github.com/xchilenox/angular-oauth2
 * @license MIT
 */
(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([ "angular", "query-string" ], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("angular"), require("query-string"));
    } else {
        root.angularOAuth2 = factory(root.angular, root.queryString);
    }
})(this, function(angular, queryString) {
    var ngModule = angular.module("angular-oauth2", [ "ngStorage" ]).config(oauthConfig).factory("httpBuffer", httpBuffer).factory("authManager", authManager).factory("oauthInterceptor", oauthInterceptor).provider("OAuth", OAuthProvider).provider("OAuthToken", OAuthTokenProvider);
    function oauthConfig($httpProvider) {
        $httpProvider.interceptors.push("oauthInterceptor");
    }
    oauthConfig.$inject = [ "$httpProvider" ];
    function oauthInterceptor($q, $rootScope, OAuthToken, httpBuffer) {
        var request = function(config) {
            if (OAuthToken.getAuthorizationHeader()) {
                config.headers = config.headers || {};
                config.headers.Authorization = OAuthToken.getAuthorizationHeader();
            }
            return config;
        };
        var responseError = function(rejection) {
            if (!angular.isObject(rejection.data)) {
                rejection.data = JSON.parse(rejection.data);
            }
            if (400 === rejection.status && rejection.data && ("invalid_request" === rejection.data.error || "invalid_grant" === rejection.data.error)) {
                OAuthToken.removeToken();
                $rootScope.$emit("oauth:error", rejection);
            }
            if (401 === rejection.status && (rejection.data && "invalid_token" === rejection.data.error) || rejection.headers("www-authenticate") && 0 === rejection.headers("www-authenticate").indexOf("Bearer")) {
                $rootScope.$emit("oauth:error", rejection);
            }
            if (401 === rejection.status && rejection.statusText === "Unauthorized") {
                if (!rejection.data) {
                    rejection.data = {
                        error: "access_denied"
                    };
                }
                if (rejection.data && rejection.data.error === "access_denied") {
                    var deferred = $q.defer();
                    httpBuffer.append(rejection.config, deferred);
                    $rootScope.$emit("oauth:login-required", rejection);
                    return deferred.promise;
                }
            }
            return $q.reject(rejection);
        };
        var factory = {
            request: request,
            responseError: responseError
        };
        return factory;
    }
    oauthInterceptor.$inject = [ "$q", "$rootScope", "OAuthToken", "httpBuffer" ];
    var _prototypeProperties = function(child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
    };
    var defaults = {
        baseUrl: null,
        clientId: null,
        clientSecret: null,
        grantPath: "/oauth2/token",
        revokePath: "/oauth2/revoke"
    };
    var requiredKeys = [ "baseUrl", "clientId", "grantPath", "revokePath" ];
    function OAuthProvider() {
        var config;
        this.configure = function(params) {
            if (config) {
                throw new Error("Already configured.");
            }
            if (!(params instanceof Object)) {
                throw new TypeError("Invalid argument: `config` must be an `Object`.");
            }
            config = angular.extend({}, defaults, params);
            angular.forEach(requiredKeys, function(key) {
                if (!config[key]) {
                    throw new Error("Missing parameter: " + key + ".");
                }
            });
            if ("/" === config.baseUrl.substr(-1)) {
                config.baseUrl = config.baseUrl.slice(0, -1);
            }
            if ("/" !== config.grantPath[0]) {
                config.grantPath = "/" + config.grantPath;
            }
            if ("/" !== config.revokePath[0]) {
                config.revokePath = "/" + config.revokePath;
            }
            return config;
        };
        this.$get = function($rootScope, $http, OAuthToken, httpBuffer, authManager) {
            var OAuth = function() {
                function OAuth() {
                    if (!config) {
                        throw new Error("`OAuthProvider` must be configured first.");
                    }
                }
                _prototypeProperties(OAuth, null, {
                    isAuthenticated: {
                        value: function isAuthenticated() {
                            return !!OAuthToken.getToken();
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getAccessToken: {
                        value: function getAccessToken(user, options) {
                            if (!user || !user.username || !user.password) {
                                throw new Error("`user` must be an object with `username` and `password` properties.");
                            }
                            var data = {
                                client_id: config.clientId,
                                grant_type: "password",
                                username: user.username,
                                password: user.password
                            };
                            if (null !== config.clientSecret) {
                                data.client_secret = config.clientSecret;
                            }
                            data = queryString.stringify(data);
                            options = angular.extend({
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                }
                            }, options);
                            return $http.post("" + config.baseUrl + "" + config.grantPath, data, options).then(function(response) {
                                OAuthToken.setToken(response.data);
                                return response;
                            });
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getFacebookAccessToken: {
                        value: function getFacebookAccessToken(user, options) {
                            if (!user || !user.id || !user.email) {
                                throw new Error("`user` must be an object with `id` and `email` properties.");
                            }
                            var data = {
                                client_id: config.clientId,
                                grant_type: "facebook",
                                id: user.id,
                                email: user.email
                            };
                            if (null !== config.clientSecret) {
                                data.client_secret = config.clientSecret;
                            }
                            data = queryString.stringify(data);
                            options = angular.extend({
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                }
                            }, options);
                            return $http.post("" + config.baseUrl + "" + config.grantPath, data, options).then(function(response) {
                                OAuthToken.setToken(response.data);
                                return response;
                            });
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getRefreshToken: {
                        value: function getRefreshToken() {
                            var data = {
                                client_id: config.clientId,
                                grant_type: "refresh_token",
                                refresh_token: OAuthToken.getRefreshToken()
                            };
                            if (null !== config.clientSecret) {
                                data.client_secret = config.clientSecret;
                            }
                            data = queryString.stringify(data);
                            var options = {
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                }
                            };
                            return $http.post("" + config.baseUrl + "" + config.grantPath, data, options).then(function(response) {
                                OAuthToken.setToken(response.data);
                                return response;
                            });
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    refreshToken: {
                        value: function refreshToken() {
                            if (!$rootScope.isRefreshingToken) {
                                $rootScope.isRefreshingToken = true;
                                return this.getRefreshToken().then(function() {
                                    authManager.loginConfirmed();
                                }, function() {
                                    authManager.loginCancelled();
                                });
                            }
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    revokeToken: {
                        value: function revokeToken() {
                            var data = queryString.stringify({
                                token: OAuthToken.getRefreshToken() ? OAuthToken.getRefreshToken() : OAuthToken.getAccessToken()
                            });
                            var options = {
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                }
                            };
                            return $http.post("" + config.baseUrl + "" + config.revokePath, data, options).then(function(response) {
                                OAuthToken.removeToken();
                                return response;
                            });
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    }
                });
                return OAuth;
            }();
            return new OAuth();
        };
        this.$get.$inject = [ "$rootScope", "$http", "OAuthToken", "httpBuffer", "authManager" ];
    }
    var _prototypeProperties = function(child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
    };
    function OAuthTokenProvider() {
        var config = {
            name: "token"
        };
        this.configure = function(params) {
            if (!(params instanceof Object)) {
                throw new TypeError("Invalid argument: `config` must be an `Object`.");
            }
            angular.extend(config, params);
            return config;
        };
        this.$get = function($localStorage) {
            var OAuthToken = function() {
                function OAuthToken() {}
                _prototypeProperties(OAuthToken, null, {
                    setToken: {
                        value: function setToken(data) {
                            return $localStorage.putObject(config.name, data);
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getToken: {
                        value: function getToken() {
                            return $localStorage.getObject(config.name);
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getAccessToken: {
                        value: function getAccessToken() {
                            return this.getToken() ? this.getToken().access_token : undefined;
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getAuthorizationHeader: {
                        value: function getAuthorizationHeader() {
                            if (!(this.getTokenType() && this.getAccessToken())) {
                                return;
                            }
                            return "" + (this.getTokenType().charAt(0).toUpperCase() + this.getTokenType().substr(1)) + " " + this.getAccessToken();
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getRefreshToken: {
                        value: function getRefreshToken() {
                            return this.getToken() ? this.getToken().refresh_token : undefined;
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    getTokenType: {
                        value: function getTokenType() {
                            return this.getToken() ? this.getToken().token_type : undefined;
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    },
                    removeToken: {
                        value: function removeToken() {
                            return $localStorage.remove(config.name);
                        },
                        writable: true,
                        enumerable: true,
                        configurable: true
                    }
                });
                return OAuthToken;
            }();
            return new OAuthToken();
        };
        this.$get.$inject = [ "$localStorage" ];
    }
    function authManager($rootScope, httpBuffer) {
        var loginConfirmed = function(data, configUpdater) {
            var updater = configUpdater || function(config) {
                return config;
            };
            httpBuffer.retryAll(updater);
            $rootScope.$broadcast("oauth:login-confirmed", data);
        };
        var loginCancelled = function(data, reason) {
            httpBuffer.rejectAll(reason);
            $rootScope.$broadcast("oauth:login-cancelled", data);
        };
        var factory = {
            loginConfirmed: loginConfirmed,
            loginCancelled: loginCancelled
        };
        $rootScope.$on("oauth:login-confirmed", function(event) {
            event.preventDefault();
            $rootScope.isRefreshingToken = false;
        });
        $rootScope.$on("oauth:login-cancelled", function(event) {
            event.preventDefault();
            $rootScope.isRefreshingToken = false;
        });
        return factory;
    }
    authManager.$inject = [ "$rootScope", "httpBuffer" ];
    function httpBuffer($injector) {
        var retryHttpRequest = function(config, deferred) {
            var successCallback = function(response) {
                deferred.resolve(response);
            };
            var errorCallback = function(response) {
                deferred.reject(response);
            };
            $http = $http || $injector.get("$http");
            $http(config).then(successCallback, errorCallback);
        };
        var append = function(config, deferred) {
            buffer.push({
                config: config,
                deferred: deferred
            });
        };
        var rejectAll = function(reason) {
            if (reason) {
                for (var i = 0; i < buffer.length; ++i) {
                    buffer[i].deferred.reject(reason);
                }
            }
            buffer = [];
        };
        var retryAll = function(updater) {
            for (var i = 0; i < buffer.length; ++i) {
                retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
            }
            buffer = [];
        };
        var factory = {
            append: append,
            rejectAll: rejectAll,
            retryAll: retryAll
        };
        var buffer = [];
        var $http;
        return factory;
    }
    httpBuffer.$inject = [ "$injector" ];
    return ngModule;
});