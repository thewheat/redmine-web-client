'use strict';

/* Filters */

var appFilters = angular.module('rmcFilters', []);


appFilters.filter('checkmark', function() {
  return function(input) {
    return input ? '\u2713' : '\u2718';
  };
});

appFilters.filter('timerdisplay', function() {
  return function(input) {
    // 10
  	var MULTIPLIER = 10;
  	var ms = input % 10;
  	var s = parseInt(input/MULTIPLIER) % 60;
  	if(s < 10) s = "0" + s;
  	var m = parseInt(input/(MULTIPLIER*60)) % 60;
  	if(m < 10) m = "0" + m;
  	var h = parseInt(input/(MULTIPLIER*3600)) % 3600;
  	if(h < 10) h = "0" + h;
    return h + ":" + m + ":" + s + "." + ms;
  };
});
appFilters.filter('netdatetodisplay', function() {
  return function(input) {

    var dd= new Date(parseInt(input.substr(6)));
    var m = dd.getMonth()+1;
    if(m < 10) m = "0" + m;
    var d = dd.getDate();
    if(d < 10) d = "0" + d;
    var y = dd.getFullYear();
    return y + "-" + m + "-" + d;
  };
});

appFilters.filter('jsdatetimetodisplay', function() {
  return function(input) {

    var dd= new Date(input);
    var m = dd.getMonth()+1;
    if(m < 10) m = "0" + m;
    var d = dd.getDate();
    if(d < 10) d = "0" + d;
    var y = dd.getFullYear();

    var hh = dd.getHours();
    if(hh < 10) hh = "0" + hh;
    var mm = dd.getMinutes();
    if(mm < 10) mm = "0" + mm;

    return y + "-" + m + "-" + d + " " + hh + ":" + mm;
  };
});
