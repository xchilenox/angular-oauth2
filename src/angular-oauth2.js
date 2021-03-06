
/**
 * Module dependencies.
 */

import angular from 'angular';
import OAuthProvider from './providers/oauth-provider';
import OAuthTokenProvider from './providers/oauth-token-provider';
import oauthConfig from './config/oauth-config';
import oauthInterceptor from './interceptors/oauth-interceptor';
import httpBuffer from './services/http-buffer';
import authManager from './services/auth-manager';
import 'angular-simple-local-storage';

var ngModule = angular.module('angular-oauth2', [
    'ngStorage'
  ])
  .config(oauthConfig)
  .factory('httpBuffer', httpBuffer)
  .factory('authManager', authManager)
  .factory('oauthInterceptor', oauthInterceptor)
  .provider('OAuth', OAuthProvider)
  .provider('OAuthToken', OAuthTokenProvider)
;

/**
 * Export `angular-oauth2`.
 */

export default ngModule;
