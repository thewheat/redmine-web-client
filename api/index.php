<?php

require_once 'vendor/autoload.php';
class App
{
	public static $SERVER;
	public static $API_KEY;

	public static function getClient (){
		$client = new Redmine\Client(App::$SERVER, App::$API_KEY);
		return $client;
	}
}
class Utils
{
	public static function getArrayValue($array, $key, $returnBlankIfDoesntExist = true)
	{
		if(!empty($array[$key])) return $array[$key];
		return "";
	}
}





class Project
{
	public static function getAll($client, $search = "")
	{
		$output = array();
		$output['projects'] =  array();
		$offset = 0;
		do
		{
			$rows = Project::getPagedList($client, $offset, $search, null);
			$output['projects'] = array_merge($output['projects'], $rows['projects']);
		}while(($offset = $rows['offset'] + $rows['limit']) < $rows['total_count']);
		return $output;
	}

	public static function getPagedList($client, $offset = 0, $search = "", $query_params = null){
		$output = array('projects' => array());
		$doSearch = (trim(@$search) != "");
		if(!is_array($query_params)) $query_params = array();
		if(empty($query_params['sort'])) $query_params['sort'] = 'name';
		$query_params['offset'] = intval($offset);
		$rows = $client->api('project')->all($query_params);

		if(!$doSearch) return $rows;
		$output['offset'] = $rows['offset'];
		$output['limit'] = $rows['limit'];
		$output['total_count'] = $rows['total_count'];
		foreach($rows['projects'] as $row)
		{
			if(stripos($row['name'],$search) !== FALSE)
				$output['projects'][] = $row;
		}
		return $output;
	}
	public static function add($client, $name, $identifier = "", $parent_id = null)
	{
		$data = array(
		    'name'        => $name,
		    'identifier'  => $identifier,
		);
		if(intval($parent_id) > 0) $data['parent_id'] = $parent_id;
		return $client->api('project')->create($data);
	}

	public static function getMembers($client, $project_id)
	{
		return $client->api('membership')->all($project_id);
	}
	public static function addMembers($client, $project_id, $data_array)
	{
		return $client->api('membership')->create($projectId, $data_array);		
	}
	public static function getPriorities($client){
		return $client->api('issue_priority')->all();
	}
	public static function getStatuses($client){
		return $client->api('issue_status')->all();
	}
	public static function getTrackers($client){
		return $client->api('tracker')->all();
	}


}



class Issue
{
	public static function getAll($client, $search_only_mine = true, $search = "", $query_params = null)
	{
		$output = array();
		$output['issues'] =  array();
		$offset = 0;
		do
		{
			$rows = Issue::getPagedList($client, $offset, $search_only_mine, $search, $query_params);
			$output['issues'] = array_merge($output['issues'], $rows['issues']);
		}while(($offset = $rows['offset'] + $rows['limit']) < $rows['total_count']);
		return $output;
	}

	public static function getPagedList($client, $offset = 0, $search_only_mine = true, $search = "", $query_params = null){
		$output = array('issues' => array());
		$doSearch = (@trim($search) != "");
		if(!is_array($query_params)) $query_params = array();
		if($search_only_mine) $query_params['assigned_to_id'] = 'me';
		if(empty($query_params['sort'])) $query_params['sort'] = 'priority:desc,updated_on';
		$query_params['offset'] = intval($offset);
		$rows = $client->api('issue')->all($query_params);
		if(!$doSearch) return $rows;
		$output['offset'] = $rows['offset'];
		$output['limit'] = $rows['limit'];
		$output['total_count'] = $rows['total_count'];
		foreach($rows['issues'] as $row)
		{
			if(stripos($row['subject'], $search) !== FALSE)
				$output['issues'][] = $row;
		}
		return $output;
	}

	public static function addUpdate($client, $id, $message)
	{
		$data = array('notes'=> $message);
		return $client->api('issue')->update($id, $data);
	}
	public static function add($client, $project_id, $subject, $description, $user_id, $status_id, $priority_id, $tracker_id){
		$data = array(
		    'project_id'     => $project_id,
		    'subject'        => $subject,
		    'description'    => $description,
		    'assigned_to_id' => $user_id,
		    'status_id' => $status_id,
		    'priority_id' => $priority_id,
		    'tracker_id' => $tracker_id
	    );

		return $client->api('issue')->create($data);
	}
}



class TimeLog
{
	// http://www.redmine.org/projects/redmine/wiki/Rest_TimeEntries
	public static function getPagedList($client){
		return $client->api('time_entry')->all();	
	}
	public static function addToIssue($client, $issue_id, $comment, $hours, $other_data=null)
	{
		TimeLog::add($client, $issue_id, $hours, $comment, false, $other_data=null);
	}
	public static function addToProject($client, $project_id, $comment, $hours, $other_data=null)
	{
		TimeLog::add($client, $project_id, $hours, $comment, true);
	}
	public static function add($client, $id, $hours, $comment, $project = false, $other_data=null)
	{
		$id_str = 'issue_id';
		if($project) $id_str = "project_id";
		if(!is_numeric($hours)) $hours = 0;
		if(!is_array($other_data)) $other_data = array();
		$other_data[$id_str] = $id;
		$other_data['hours'] = $hours;
		$other_data['comments'] = $comment;
		return @$client->api('time_entry')->create($other_data); // weird xml warning
	}
	// http://www.redmine.org/projects/redmine/wiki/Rest_TimeEntries
	public static function getActivities($client)
	{
		return $client->api('time_entry_activity')->all();		
	}
}
######################################################################
function processProjects($action)
{
	switch($action)
	{
		case "all":
			getProjectsAllWrapper();
			break;
		case "list":
			getProjectsPagedWrapper();
			break;
		case "add":
			addProjectWrapper();
			break;
		case "members":
			getProjectsMembersWrapper();
			break;
		case "priorities":
			getProjectsPrioritiesWrapper();
			break;
		case "trackers":
			getProjectsTrackersWrapper();
			break;
		case "statuses":
			getProjectsStatusesWrapper();
			break;
	}
}

function addProjectWrapper()
{
	$name = Utils::getArrayValue($_POST, 'name');
	$identifier = Utils::getArrayValue($_POST,'identifier');
	if(empty($identifier)) $identifier = $name;
	$parent_id = Utils::getArrayValue($_POST,'parent_id');
	if(trim($identifier) === "") $identifier = $name;
	print(json_encode(Project::add(App::getClient(), $name, $identifier, $parent_id)));

	// TODO: inherit membership
	// $members = Project::getMembers(App::getClient(), 17);
	// echo "<PRE>";
	// print_r($members);

	// echo "<HR>";
	// $members = Project::getMembers(App::getClient(), 223);
	// print_r($members);

	// #$members = Project::addMembers(App::getClient(), 223, array('user_id'));
	// #print_r($members);

	// echo "<HR>";
	// $members = Project::getMembers(App::getClient(), 223);
	// print_r($members);
	// die;

}
function getProjectsAllWrapper()
{
	$data = Project::getAll(App::getClient());
	print(json_encode($data));
}
function getProjectsTrackersWrapper()
{
	$data = Project::getTrackers(App::getClient());
	print(json_encode($data));
}
function getProjectsPrioritiesWrapper()
{
	$data = Project::getPriorities(App::getClient());
	print(json_encode($data));
}
function getProjectsStatusesWrapper()
{
	$data = Project::getStatuses(App::getClient());
	print(json_encode($data));
}
function getProjectsMembersWrapper()
{
	$project_id = Utils::getArrayValue($_GET,'project_id');
	$data = Project::getMembers(App::getClient(), $project_id);

	App::getClient()->api('membership')->all('client-access');
	print(json_encode($data));
}
function getProjectsPagedWrapper()
{
	$query_params = array();
	$search = trim(Utils::getArrayValue($_GET, 'search'));
	$mine = intval(Utils::getArrayValue($_GET, 'mine'));
	$offset = intval(Utils::getArrayValue($_GET, 'offset'));
	$data = Project::getPagedList(App::getClient(), $offset, $search, $query_params);
	print(json_encode($data));
}

function processIssues($action)
{
	switch($action)
	{
		case "mine":
			getIssuesAllWrapper();
			break;
		case "all":
			getIssuesAllWrapper(false);
			break;
		case "list":
			getIssuesPagedWrapper();
			break;
		case "add":
			addIssueWrapper();
			break;
		case "addUpdate":
			addUpdateWrapper();
			break;
	}
}


function addIssueWrapper()
{
	$project_id = Utils::getArrayValue($_POST,'project_id');
	$subject = Utils::getArrayValue($_POST,'subject');
	$description = Utils::getArrayValue($_POST,'description');

	$status_id = Utils::getArrayValue($_POST,'status_id');
	$tracker_id = Utils::getArrayValue($_POST,'tracker_id');
	$user_id = Utils::getArrayValue($_POST,'assigned_to_id');
	$priority_id = Utils::getArrayValue($_POST,'priority_id');

	print(json_encode(Issue::add(App::getClient(), $project_id, $subject, $description, $user_id, $status_id, $priority_id, $tracker_id)));
}
function addUpdateWrapper()
{
	$issue_id = Utils::getArrayValue($_POST,'issue_id');
	$message = Utils::getArrayValue($_POST,'message');
	print(json_encode(Issue::addUpdate(App::getClient(), $issue_id, $message)));
}
function getIssuesAllWrapper($mine = true)
{
	$data = Issue::getAll(App::getClient(), $mine, "", null);
	print(json_encode($data));
}
function getIssuesPagedWrapper()
{
	$query_params = array();
	$search = trim(Utils::getArrayValue($_GET, 'search'));
	$mine = intval(Utils::getArrayValue($_GET, 'mine'));
	$offset = intval(Utils::getArrayValue($_GET, 'offset'));
	if(!empty($_GET['search_closed'])) $query_params['status_id'] = '*';
	$data = Issue::getPagedList(App::getClient(), $offset, $mine, $search, $query_params);
	print(json_encode($data));
}

function processTimes($action)
{
	switch($action)
	{
		case "add":
		case "addToIssue":
		case "logToIssue":
			addTimeLogWrapper();
			break;
		case "addToProject":
		case "logToProject":
			addTimeLogWrapper(true);
			break;
		case "list":
			getTimeLogWrapper();
			break;
		case "getActivities":
			getTimeLogActivitiesWrapper();
	}
}

function addTimeLogWrapper($project=false)
{
	$id = Utils::getArrayValue($_POST,'id');
	$hours = Utils::getArrayValue($_POST,'hours');
	$comment = Utils::getArrayValue($_POST,'comment');

	$spent_on = Utils::getArrayValue($_POST,'spent_on');
	$activity_id = Utils::getArrayValue($_POST,'activity_id');

	
	if(!is_numeric($hours)) $hours = 0.00;
	$client = App::getClient();
	if($project)
		return TimeLog::addToProject($client, $id, $comment, $hours);
	else
		return TimeLog::addToIssue($client, $id, $comment, $hours);
}

function getTimeLogWrapper()
{
	$data = TimeLog::getPagedList(App::getClient());
	print(json_encode($data));
}
function getTimeLogActivitiesWrapper()
{
	$data = TimeLog::getActivities(App::getClient());
	print(json_encode($data));
}
function showTestPage()
{
	?>
	<h2>TimeLogs</h2>
	<form method="POST" action="?mode=timelogs&action=add">
		Issue id: <input type="text" name="id" value='1137'>
		Hours: <input type="text" name="hours">
		Comment: <input type="text" name="comment" value='comment to issue'>
		<input type="submit" value="Add to Issue">
	</form>
	<form method="POST" action="?mode=timelogs&action=addToProject">
		Project id: <input type="text" name="id" value='17'>
		Hours: <input type="text" name="hours">
		Comment: <input type="text" name="comment" value='comment to project'>
		<input type="submit" value="Add to Project">
	</form>
	<form method="GET" action="?mode=timelogs&action=list">
		<input type="submit" value="Show List">
	</form>
	<?php
}


if(isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], "application/json") !== false) {
    $_POST = array_merge($_POST, (array) json_decode(trim(file_get_contents('php://input')), true));
}
$mode = (Utils::getArrayValue($_GET, 'mode'));
if(trim($mode) == "") $mode = (Utils::getArrayValue($_POST,'mode'));

$action = (Utils::getArrayValue($_GET, 'action'));
if(trim($action) == "") $action = (Utils::getArrayValue($_POST,'action'));

$id = (Utils::getArrayValue($_GET, 'id'));
if(trim($id) == "") $id = (Utils::getArrayValue($_POST,'id'));

App::$API_KEY = (Utils::getArrayValue($_GET, 'key'));
if(trim(App::$API_KEY) == "") App::$API_KEY = (Utils::getArrayValue($_POST,'key'));


App::$SERVER = Utils::getArrayValue($_GET, 'server');
App::$API_KEY = Utils::getArrayValue($_GET, 'api_key');
try
{
	switch($mode)
	{
		case "projects":
			processProjects($action);
			break;
		case "issues":
			processIssues($action);
			break;
		case "logs":
		case "timelogs":
		case "time_entry":
			processTimes($action);
			break;
		default:
			showTestPage();
	}
}
catch(Exception $e)
{
	header("HTTP/1.0 500 Internal Server Error");
	error_log($e->getMessage());
	die($e->getMessage());

}