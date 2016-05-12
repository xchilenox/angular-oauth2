
/**
 * Http buffer.
 *
 * @ngInject
 */

function httpBuffer($rootScope, $injector) {
    var factory = {
        append: append,
        rejectAll: rejectAll,
        retryAll: retryAll
    };

    // Holds all the requests, so they can be re-requested in future.
    var buffer = [];

    // Service initialized later because of circular dependency problem.
    var $http;

    function retryHttpRequest(config, deferred, index) {
        function successCallback(response) {
            deferred.resolve(response);
            removeFromBuffer(index);
        }

        function errorCallback(response) {
            deferred.reject(response);
            removeFromBuffer(index);
        }

        $http = $http || $injector.get('$http');
        $http(config).then(successCallback, errorCallback);
    }

    // Appends HTTP request configuration object with deferred response attached to buffer.
    function append(config, deferred) {
        buffer.push({
            config: config,
            deferred: deferred
        });
    }

    // Abandon or reject (if reason provided) all the buffered requests.
    function rejectAll(reason) {
        if(reason) {
            for(var i = 0; i < buffer.length; ++i) {
                buffer[i].deferred.reject(reason);
            }
        }
        buffer = [];
    }

    // Retries all the buffered requests clears the buffer.
    function retryAll(updater) {
        for(var i = 0; i < buffer.length; ++i) {
            retryHttpRequest(updater(buffer[i].config), buffer[i].deferred, i);
        }
    }

    // Remove an element from array by index
    function removeFromBuffer(index) {
        buffer.splice(index, 1);
        if(buffer.length === 0) {
            $rootScope.$broadcast('oauth:retry-completed');
        }
    }

    return factory;
}

/**
 * Export `httpBuffer`.
 */

export default httpBuffer;