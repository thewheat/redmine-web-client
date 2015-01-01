'use strict';

var appControllers = angular.module('rcmControllers', ['angular-bootstrap-select']);
var APP = {};
APP.db = (function(){
  function supports_html5_storage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }
  function add(key, value){
    if(!supports_html5_storage()) return;
    localStorage[key] = value;
  }
  function get(key, defaultValue){
    if(!supports_html5_storage()) return "";
    //console.log(key, localStorage[key]);
    if(localStorage[key] == null) return defaultValue;
    return localStorage[key];
  }

  return {
    "add": add,
    "get": get
  }
})();


appControllers.controller('RMCCtrl', ['$scope', '$timeout', '$http', '$location', '$anchorScroll',
  function($scope, $timeout, $http, $location, $anchorScroll) {
    $scope.haveServerDetails = function(){
      return (APP.db.get('server') && APP.db.get('api_key'));
    }
    $scope.serverDetails = function(){
      return "&server=" + encodeURIComponent(APP.db.get('server')) 
            + "&api_key=" + encodeURIComponent(APP.db.get('api_key')) 
            + "&key=" + encodeURIComponent(APP.db.get('api_key')) 
            ;
    }
    $scope.getServer = function(){ return APP.db.get('server'); }
    $scope.getAPIKey = function(){ return APP.db.get('api_key'); }

    $scope.setGlobalMessage = function(msg, extra) { 
      if(!extra) extra  = {}
      $scope.global_message = msg; 
      $scope.global_url = {
        url:  (typeof(extra.url) == "undefined" ? "" : extra.url),
        text: (typeof(extra.text) == "undefined" ? msg : extra.text)
      };
    }

    $scope.getIssueLink = function(id) { return $scope.getServer() + "/issues/" + id }
    $scope.getProjectLink = function(id) { return $scope.getServer() + "/projects/" + id }

    $scope.cancelSearch = function(){
      $scope.is_searching = false;
      $scope.search_count++;
      $scope.setGlobalMessage('Search cancelled');
    }

    // refresh my issues every x seconds
    $scope.issueReloadTick = function(){
        $scope.issueReloadCounter = parseInt($scope.issueReloadCounter);
        if(isNaN($scope.issueReloadCounter)) $scope.issueReloadCounter = 0;
        else
          $scope.issueReloadCounter -= 1;
        if($scope.show_issues && $scope.is_searching_mine) {
          if($scope.issueReloadCounter <= 0)
            $scope.loadMyIssues();
          else
            $scope.issueReloadObject = $timeout($scope.issueReloadTick ,1000);
        }
        else
            $scope.issueReloadObject = null;
    }

    $scope.loadMyIssues = function(){
      $scope.setGlobalMessage('loading...');
      $scope.is_searching_mine = true;
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      $http.get('../../api/?mode=issues&action=mine' + $scope.serverDetails())
        .success(function(data) {
          $scope.setGlobalMessage('');
          $scope.myissues = data['issues'];

          $scope.issueReloadCounter = $scope.issueReloadInSeconds;
          if($scope.issueReloadObject == null)
            $scope.issueReloadObject = $timeout($scope.issueReloadTick ,1000);
        })
        .error(function(data,status){
          alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.loadProjectMembers = function($project_id){
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      $scope.project_members = [];
      $http.get('../../api/?mode=projects&action=members&project_id=' + $project_id + $scope.serverDetails())
        .success(function(data) {
          $scope.project_members = data['memberships'];
          if($scope.issue_assignee){
            var found = false;
            for(var i = data['memberships'].length-1; i >= 0 ; i--){
              if(data['memberships'][i]
                && data['memberships'][i].user
                && data['memberships'][i].user.id == $scope.issue_assignee){
                found = true;
                break;
              }
            }
            if(!found) $scope.issue_assignee = '';
          }
        })
        .error(function(data,status){
          alert('Failed: ' + status + ": " + data);
        });
    }

    $scope.loadProjectStatuses = function($project_id){
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      $scope.project_statuses = [];
      $http.get('../../api/?mode=projects&action=statuses&project_id=' + $project_id + $scope.serverDetails())
        .success(function(data) {
          $scope.project_statuses = data['issue_statuses'];
        })
        .error(function(data,status){
          alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.loadProjectTrackers = function($project_id){
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      $scope.project_trackers = [];
      $http.get('../../api/?mode=projects&action=trackers&project_id=' + $project_id + $scope.serverDetails())
        .success(function(data) {
          $scope.project_trackers = data['trackers'];
        })
        .error(function(data,status){
          alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.loadProjectPriorities = function($project_id){
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      $scope.project_priorities = [];
      $http.get('../../api/?mode=projects&action=priorities&project_id=' + $project_id + $scope.serverDetails())
        .success(function(data) {
          $scope.project_priorities = data['issue_priorities'];
        })
        .error(function(data,status){
          alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.loadProjects = function(hideLoadingMessage, callback){
      if(!hideLoadingMessage)
        $scope.setGlobalMessage('loading...');
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }


      $http.get('../../api/?mode=projects&action=all' + $scope.serverDetails())
        .success(function(data) {
          if(!hideLoadingMessage)
            $scope.setGlobalMessage('');

          $scope.projects_parent_id_manual_select_ori = $scope.projects_parent_id_manual_select;
          $scope.projects_parent_id_manual_select += '_';
          $scope.projects = data['projects'].filter(function(item){return item.status == "1"});
          $scope.projects = $scope.projects.map(function(element){
            element.displayname = '';
            if(element.parent && element.parent.name){
              element.displayname = element.parent.name + " - ";
            }
            element.displayname += element.name;
            return element;
          });
          $timeout(function(){
            $scope.projects_parent_id_manual_select = $scope.projects_parent_id_manual_select_ori;
          }, 100);
          if(callback && callback['success'] && typeof(callback['success']) == "function"){
            callback['success'](data);
            return;
          }
        })
        .error(function(data,status){
          if(callback && callback['error'] && typeof(callback['error']) == "function"){
            callback['error'](data, status);
            return;
          }
          else
            alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.loadSearchIssues = function(offset, search, count){
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      $scope.is_searching_mine = false;
      
      if(!offset) offset = 0;    
      offset = parseInt(offset);
      if(isNaN(offset)) offset = 0;
      
      if(!count) count = 0;    
      count = parseInt(count);
      if(isNaN(count)) count = 0;

      if(!search) search = $scope.query;

      if(offset == 0) // start of a new search
      {
        $scope.is_searching = true;
        $scope.search_count++;
        count = $scope.search_count;
      }
      if($scope.search_count != count) return;


      $scope.setGlobalMessage('loading...');
      if(offset != 0)
        $scope.global_message += ' (' + offset + '/' + $scope.issue_count + ')';

      $http.get('../../api/?mode=issues&action=list&offset=' + offset +'&search=' + search + $scope.serverDetails())
        .success(function(data) {
          if($scope.search_count != count) return;

          $scope.setGlobalMessage('');
          if(!offset)
          {
            $scope.myissues = data['issues'];
            $scope.issue_count = data.total_count;
          }
          else{
            data['issues'].map(function(i){ $scope.myissues.push(i)})
          }
          if(data.offset + data.limit < data.total_count){
            $scope.loadSearchIssues(data.offset + data.limit, search, count);
          }
          else
            $scope.is_searching = false;
        })
        .error(function(data,status){
          alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.logTimeEntry = function(id, hours, comment, addToProject, onsuccess, onerror){
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      var inputData = {
        id: id,
        comment: comment,
        hours: hours
      }
      $http.post('../../api/?mode=timelogs&action=add' + (addToProject ? "ToProject" : "") + $scope.serverDetails(), inputData)
        .success(function(data) {
          if(typeof(onsuccess)=="function") onsuccess();
          else {
            $scope.timer_message = 'Added';
            $scope.time_comment = '';
          }
        })
        .error(function(data,status){
          if(typeof(onerror)=="function") onerror();
          else alert('Failed: ' + status + ": " + data);
        });
    }

    $scope.addComment = function(hours){
      var successComment = function(data){
        $scope.issues_comment_message = 'Added';
        $scope.time_comment = '';
      }
      $scope.issues_comment_message = 'Adding...';
      if($scope.selectedIssue)
        $scope.logTimeEntry($scope.selectedIssue.id, 0.001, $scope.time_comment, false,successComment);
      else if($scope.selectedProject)
        $scope.logTimeEntry($scope.selectedProject.id, 0.001, $scope.time_comment, true,successComment);
    }
    $scope.addTime = function(hours){
      if($scope.selectedIssue)
        $scope.logTimeEntry($scope.selectedIssue.id, hours,$scope.time_comment, false);
      else if($scope.selectedProject)
        $scope.logTimeEntry($scope.selectedProject.id, hours,$scope.time_comment, true);
    }
    $scope.tick = function(){
        if(!$scope.timerEnabled) {
          $scope.timerObject = null;
          return;
        }
        $scope.timerCount = parseInt(((new Date()).getTime() - $scope.timerStart + $scope.timerStartOffet)/100);
        APP.db.add('count', $scope.timerCount);
        APP.db.add('query', $scope.query);
        if($scope.selectedIssue)
          APP.db.add('selected_issue', $scope.selectedIssue.id);
        if($scope.selectedProject)
          APP.db.add('selected_project', $scope.selectedProject.id);
        $scope.timerObject = $timeout($scope.tick ,100); 
    };
    $scope.startTimer = function(){ 
      $scope.timer_message = '';
      $scope.timerEnabled = true;
      if(!$scope.timerObject){
        $scope.timerStart = (new Date()).getTime();
        $scope.timerObject = $timeout($scope.tick ,100); 
      }
      $scope.scrollTo('timer');
    }

    // prevent hash change from reloading view and controller
    $scope.$on('$locationChangeStart', function(ev) {
        ev.preventDefault();
    });

    // doesn't scroll if item is hidden
    $scope.scrollTo = function(id){
      $timeout(function(){
        $location.hash(id);
        $anchorScroll();
      }, 100);
    }
    $scope.stopTimer = function(){ 
      $scope.timerEnabled = false;
      $scope.timerObject = null;
    }
    $scope.toggleTimer = function(){ 
      $scope.timerEnabled = !$scope.timerEnabled;
      if($scope.timerEnabled){
        $scope.timer_message = '';
        $scope.timerStart = (new Date()).getTime();
        // console.log("start   : " + $scope.timerStart);
        // console.log("  offset: " + $scope.timerStartOffet);
          
        $scope.timerObject = $timeout($scope.tick ,100); 
      }
      else{
        $scope.timer_message = 'Logging Time';
        $scope.addTime($scope.timerCount/36000.0);
        // console.log("stop        : " + $scope.timerStart);
        // console.log("  old offset: " + $scope.timerStartOffet);
        $scope.timerStartOffet = (new Date()).getTime() - $scope.timerStart + $scope.timerStartOffet;
        // console.log("stop        : " + $scope.timerStart);
        // console.log("  new offset: " + $scope.timerStartOffet);
        $scope.resetTimer();
      }
    }
    $scope.resetTimer = function(){ 
      $scope.timer_message = '';
      $scope.timerObject = null;
      $scope.timerCount = 0;
      $scope.timerEnabled = false;
      $scope.timerStart = 0;
      $scope.timerStartOffet = 0;
    }
    $scope.clearSelected = function(){
      $scope.selectedIssue = null;
      $scope.selectedProject = null;

      $scope.setGlobalMessage('');
      $scope.issues_update_message='';
      $scope.issues_comment_message='';

      $scope.resetTimer();
    }
    $scope.selectIssue = function(row){
      $scope.selectedProject = null;
      $scope.selectedIssue = row;
      if($scope.settings_ckeditor && !CKEDITOR.instances['ckeditorUpdate'])
        CKEDITOR.replace( 'ckeditorUpdate' );
      else if(!$scope.settings_ckeditor && CKEDITOR.instances['ckeditorUpdate'])
        CKEDITOR.instances['ckeditorUpdate'].destroy();
    }
    $scope.selectProject = function(row){
      $scope.selectedIssue = null;
      $scope.selectedProject = row;
    }

    $scope.selectRow = function(row){
      $scope.selectIssue(row);
      $scope.startTimer();
    }
    $scope.selectProjectRow = function(row){
      $scope.selectProject(row);
      $scope.startTimer();
    }
    $scope.addCommentAndClose = function(){
      var id = $scope.selectedIssue.Id;
      $scope.addTime($scope.timerCount/36000.0);
      $scope.addComment();
      $scope.closeIssue(id);
      $scope.clearSelected();
      $scope.resetTimer();
    }
    $scope.toggleSettings = function(show){ 
      if(show) $scope.showSettings = true;
      else $scope.showSettings = !$scope.showSettings; 
    }
    $scope.saveSettings = function(){
      if(!$scope.settings_server.match(/^https?:\/\//i))
        $scope.settings_server = "http://"+$scope.settings_server;
      APP.db.add("server", $scope.settings_server);
      APP.db.add("api_key", $scope.settings_api_key);
      APP.db.add("settings_ckeditor", $scope.settings_ckeditor);
      $scope.toggleSettings();
      if($scope.show_issues)
        $scope.loadMyIssues();
      if($scope.show_projects)
        $scope.loadProjects();
    }
    $scope.restoreState = function(){
        $scope.settings_server = APP.db.get("server");
        $scope.settings_api_key = APP.db.get("api_key");
        $scope.settings_ckeditor = (APP.db.get("settings_ckeditor") && APP.db.get("settings_ckeditor").match(/true/gi) ? true : false);

        // $scope.timerStartOffet = APP.db.get('count');
        // $scope.query = APP.db.get('query');
        // $scope.query = APP.db.get('selected_issue')
        // APP.db.add('selected_issue', $scope.selectedIssue.id);
    }
    $scope.notifiyNoServerDetails = function(){
      alert("No server details. Fill in details")
      $scope.toggleSettings(true);
    }


    $scope.toggleIssues = function(show){
      if(!$scope.issues || $scope.issues.length == 0)
        $scope.loadMyIssues();
      APP.db.add("show_issues", $scope.show_issues);
    }
    $scope.toggleProjects = function(){
      if(!$scope.projects || $scope.projects.length == 0)
        $scope.loadProjects();
      APP.db.add("show_projects", $scope.show_projects);
    }
    $scope.selectProjectToAddSubProject = function(row){
      $scope.projects_add_project = true;
      $scope.add_project = true;
      $scope.projects_parent_name = row.name;
      $scope.projects_parent_id = row.id;
      $scope.scrollTo('add-project');
    }

    $scope.selectRowManual = function(){
      var rowid = $scope.projects_parent_id_manual_select;
      $scope.loadProjectPriorities(rowid);
      $scope.loadProjectMembers(rowid);
      $scope.loadProjectStatuses(rowid)
      $scope.loadProjectTrackers(rowid)
    }
    $scope.showAddIssueForm = function(){
      if($scope.settings_ckeditor && !CKEDITOR.instances['ckeditor'])
        CKEDITOR.replace( 'ckeditor' );
      else if(!$scope.settings_ckeditor && CKEDITOR.instances['ckeditor'])
        CKEDITOR.instances['ckeditor'].destroy();
      $scope.scrollTo('add-issue');
    }
    $scope.selectProjectToAddIssue = function(row){
      $scope.projects_add_issue = true;
      $scope.projects_parent_name = row.name;
      $scope.projects_parent_id = row.id;

      $scope.loadProjectPriorities(row.id);
      $scope.loadProjectMembers(row.id);
      $scope.loadProjectStatuses(row.id)
      $scope.loadProjectTrackers(row.id)
      $scope.showAddIssueForm();
    }
    $scope.clearAddIssue = function(){
      $scope.projects_add_issue = false;
      $scope.projects_issue_message='';
      if($scope.settings_ckeditor && CKEDITOR.instances['ckeditor'])
        CKEDITOR.instances['ckeditorUpdate'].setData('');

    }
    $scope.clearAddIssueFields = function(){
      $scope.projects_add_issue = false;
      $scope.projects_issue_message='';
      $scope.projects_parent_name = "";
      $scope.projects_parent_id = "";
      $scope.issue_subject = "";
      $scope.issue_description = "";
      $scope.issue_priority = "";
      $scope.issue_assignee = "";
      $scope.issue_tracker = "";
      $scope.issue_status = "";
      $scope.issue_private = "";
      if($scope.settings_ckeditor && CKEDITOR.instances['ckeditor'])
        CKEDITOR.instances['ckeditor'].setData('');

    }
    $scope.clearProject = function(){
      $scope.projects_parent_name = "";
      $scope.projects_parent_id = 0;
      $scope.projects_message = '';
    }
    $scope.addProject = function(){
      $scope.projects_message = 'adding...';
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      if(!$scope.project_identifier) $scope.project_identifier = $scope.project_name.replace(/ /g,'-').replace(/\W+/g,'');
      var inputData = {
        name: $scope.project_name,
        identifier: $scope.project_identifier,
        parent_id: $scope.projects_parent_id
      }
      $http.post('../../api/?mode=projects&action=add' + $scope.serverDetails(), inputData)
        .success(function(data) {
          if(data.error){
            $scope.projects_message = 'ERROR: ' + data.error;
            alert($scope.projects_message)
            return;
          }
          $scope.projects_message = 'Added';
          $scope.loadProjects(true);
          $scope.setGlobalMessage("Added", { 
            url: $scope.getProjectLink(data.id),
            text: "View Project " + data.name
          }); 
          alert("Note: You will need to manually specify inherit members");
          $scope.clearAddProjectFields();
          $scope.toggleAddProject();
        })
        .error(function(data,status){
          $scope.projects_message = 'Failed';
          if(typeof(onerror)=="function") onerror();
          else alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.addIssueUpdate= function(){
      $scope.issues_update_message = 'adding...';
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      if($scope.settings_ckeditor && CKEDITOR.instances['ckeditorUpdate']){
        $scope.issue_update_message = CKEDITOR.instances['ckeditorUpdate'].getData();
      }
      var inputData = {
        message: $scope.issue_update_message,
        private: $scope.issue_update_private,
        issue_id: $scope.selectedIssue.id
      }
      $http.post('../../api/?mode=issues&action=addUpdate' + $scope.serverDetails(), inputData)
        .success(function(data) {
          if(typeof(onsuccess)=="function") onsuccess();
          else {
            $scope.issues_update_message = 'Added';
            $scope.issue_update_message = '';
          }
        })
        .error(function(data,status){
            $scope.issues_update_message = 'Failed';
          if(typeof(onerror)=="function") onerror();
          else alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.showGenericIssueForm = function(){
      $scope.projects_add_issue = true;
      $scope.projects_parent_name = '';
      $scope.projects_parent_id = 0;

      if(!$scope.projects || $scope.projects.length == 0){
        $scope.setGlobalMessage('loading projects...');
        $scope.loadProjects(true, {
          'success': function(){

          }
        })
      }
      $scope.showAddIssueForm();
    }
    $scope.addIssue = function(){
      $scope.projects_issue_message = 'adding...';
      if($scope.settings_ckeditor && CKEDITOR.instances['ckeditor']){
        $scope.issue_description = CKEDITOR.instances['ckeditor'].getData();
      }
      if(!$scope.haveServerDetails()) { $scope.notifiyNoServerDetails(); return; }
      var project_id = $scope.projects_parent_id;
      if(!project_id) project_id = $scope.projects_parent_id_manual_select;

      var inputData = {
        project_id: project_id,
        subject: $scope.issue_subject,
        description: $scope.issue_description,
        priority_id: $scope.issue_priority,
        assigned_to_id: $scope.issue_assignee,
        tracker_id: $scope.issue_tracker,
        status_id: $scope.issue_status,
        private: $scope.issue_private,

      }
      $http.post('../../api/?mode=issues&action=add' + $scope.serverDetails(), inputData)
        .success(function(data) {
          if(data.error){
            $scope.projects_message = 'ERROR: ' + data.error;
            alert($scope.projects_message)
            return;
          }
          $scope.setGlobalMessage("Added", { 
            url: $scope.getIssueLink(data.id),
            text: "View Issue #" + data.id
          }); 
          $scope.projects_issue_message = "Added #" + data.id;
          $scope.clearAddIssueFields();
          $scope.clearAddIssue();
          $scope.scrollTo('header');
        })
        .error(function(data,status){
            $scope.projects_issue_message = 'Failed';
          if(typeof(onerror)=="function") onerror();
          else alert('Failed: ' + status + ": " + data);
        });
    }
    $scope.toggleAddProject = function()
    {
      $scope.add_project = !$scope.add_project;
      if($scope.add_project) $scope.project_identifier = '';
    }
    $scope.clearAddProjectFields = function()
    {
      $scope.project_name = '';
      $scope.project_identifier = '';
      $scope.projects_parent_id = 0;
    }
    $scope.searchProjectsFilter = function(element, searchTerm){
      if(typeof(searchTerm) == "undefined" || searchTerm == "") return true;
      var name = '';
      if(element.parent && element.parent.name)
        name = element.parent.name + ' - ';
      if(element.name)
        name += element.name;
      var search_terms = searchTerm.split(" ");
      var match = true;
      for(var i = 0; i < search_terms.length; i++){
        var regex = RegExp(search_terms[i], 'gi');
        match = ((name.match(regex)) ? true : false);
        if(!match) break;
      }
      return match;
    }
    $scope.searchProjectsFilterProjectList = function(element){
      return $scope.searchProjectsFilter(element, $scope.query_projects);
    }
    $scope.searchProjectsFilterAddIssue = function(element){
      return $scope.searchProjectsFilter(element, $scope.issue_search_project);
    }

    $scope.show_issues = ("true" == APP.db.get("show_issues","true"));
    $scope.show_projects = ("true" == APP.db.get("show_projects","true"));

    $scope.issues_comment_message='';
    $scope.issues_update_message= '';
    $scope.projects = [];
    $scope.time_comment = '';
    $scope.issue_update_message = '';
    $scope.projects_issue_message='';
    $scope.projects_message = '';
    $scope.add_project = false;
    $scope.add_comment_message = '';
    $scope.projects_add_project = false;
    $scope.projects_parent_name = "";
    $scope.projects_parent_id = 0;
    $scope.project_members = [];
    $scope.project_statuses = [];
    $scope.project_priorities = [];
    $scope.project_trackers = [];
    $scope.is_searching = false;
    $scope.is_searching_mine = false;
    $scope.search_count = 0;
    $scope.setGlobalMessage('');
    $scope.query = '';
    $scope.query_projects = '';
    $scope.showSettings = false;
    $scope.clearSelected();
    $scope.resetTimer();
    $scope.restoreState();
    $scope.issueReloadObject = null; // object to assign timer to
    $scope.issueReloadInSeconds = 30; // max reload in seconds
    $scope.issueReloadCounter = $scope.issueReloadInSeconds; // current count
    if(!$scope.haveServerDetails())
      $scope.notifiyNoServerDetails();
    else{
      if($scope.show_issues)
        $scope.loadMyIssues();
      if($scope.show_projects)
        $scope.loadProjects();
    }

  }]);
