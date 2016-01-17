
/**
 * Auth manager.
 *
 * @ngInject
 */

function authManager($rootScope, httpBuffer) {
    var factory = {
        loginConfirmed: loginConfirmed,
        loginCancelled: loginCancelled
    };

    function loginConfirmed(data, configUpdater) {
        var updater = configUpdater || function(config) { return config; };
        httpBuffer.retryAll(updater);
        $rootScope.$broadcast('oauth:login-confirmed', data);
    }

    function loginCancelled(data, reason) {
        httpBuffer.rejectAll(reason);
        $rootScope.$broadcast('oauth:login-cancelled', data);
    }

    $rootScope.$on('oauth:login-confirmed', function(event) {
        event.preventDefault();
        $rootScope.isRefreshingToken = false;
    });

    $rootScope.$on('oauth:login-cancelled', function(event) {
        event.preventDefault();
        $rootScope.isRefreshingToken = false;
    });

    return factory;
}

/**
 * Export `authManager`.
 */

export default authManager;