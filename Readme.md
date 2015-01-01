# A Redmine Web Client

- Aimed currently for time tracking for tasks and projects
- Cross platform and mobile accessible
- Does not require a database
- Based off [RMClient](http://rmclient.org/) but aimed to be cross platform & tailored to my personal needs

# Requirements

- A web browser that supports HTML 5 storage
- Server running PHP >= 5.3.2 with cURL extension (based on requirements of [PHP Redmine API](https://github.com/kbsali/php-redmine-api))
- Redmine server with "Enable REST web service" turned on (/settings/edit?tab=authentication)
- API access key (/my/account)

# Installation

- Copy folder to server
- Run ```bower install``` from ```ui/app``` directory
- If there are any problems it is probably with PHP Redmine API as my code

# Code Folders

- /api/ : server side PHP code (essentially only index.php)
- /ui/ : client side Angular JS code

# Built Using 

- [AngularJS](http://angularjs.org) (client side)
- [PHP Redmine API](https://github.com/kbsali/php-redmine-api) (server side)

# Features to come

- Adding projects & subjects
- Adding an issue to a project
- Adding updates to issues
