'use strict';

/* App Module */

var phonecatApp = angular.module('phonecatApp', [
  'ngRoute',
  'rcmControllers',
  'rmcFilters',
]);

phonecatApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'partials/issue-list.html',
        controller: 'RMCCtrl'
      }).
      when('/issue/:issueId', {
        templateUrl: 'partials/issue-detail.html',
        controller: 'IssueDetailCtrl'
      }).
      when('/project/:projectId', {
        templateUrl: 'partials/project-detail.html',
        controller: 'ProjectDetailCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);
