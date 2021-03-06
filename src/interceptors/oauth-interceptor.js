
/**
 * OAuth interceptor.
 *
 * @ngInject
 */

function oauthInterceptor($q, $rootScope, OAuthToken, httpBuffer) {
    var factory = {
        request: request,
        responseError: responseError
    };

    function request(config) {
        // Inject `Authorization` header.
        if(OAuthToken.getAuthorizationHeader()) {
            config.headers = config.headers || {};
            config.headers.Authorization = OAuthToken.getAuthorizationHeader();
        }

        return config;
    }

    function responseError(rejection) {
        var output = $q.reject(rejection);

        // Convert to JSON if is not an object
        if(!angular.isObject(rejection.data)) {
            rejection.data = JSON.parse(rejection.data);
        }

        // Catch `invalid_request` and `invalid_grant` errors and ensure that the `token` is removed.
        if(400 === rejection.status && rejection.data && ('invalid_request' === rejection.data.error || 'invalid_grant' === rejection.data.error)) {
            OAuthToken.removeToken();
            $rootScope.$emit('oauth:error', rejection);
        }

        // Catch `invalid_token` and `unauthorized` errors.
        // The token isn't removed here so it can be refreshed when the `invalid_token` error occurs.
        if(401 === rejection.status && (rejection.data && 'invalid_token' === rejection.data.error) || (rejection.headers('www-authenticate') && 0 === rejection.headers('www-authenticate').indexOf('Bearer'))) {
            $rootScope.$emit('oauth:error', rejection);
        }

        // Catch `access_denied` and `unauthorized` errors.
        // The token isn't removed here and will be refreshed when the `access_denied` error occurs.
        if(401 === rejection.status && (rejection.data && 'access_denied' === rejection.data.error) || (rejection.headers('www-authenticate') && 0 === rejection.headers('www-authenticate').indexOf('Bearer'))) {
            var deferred = $q.defer();
            httpBuffer.append(rejection.config, deferred);
            $rootScope.$emit('oauth:error', rejection);
            output = deferred.promise;
        }

        return output;
    }

    return factory;
}

/**
 * Export `oauthInterceptor`.
 */

export default oauthInterceptor;