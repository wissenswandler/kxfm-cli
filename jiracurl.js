import jiraAPI from 'jira-client'
import KTS4Jira from './KTS4Jira.js';
import chalk from 'chalk';

// read Jira Cloud instance name from first command line argument or use default
const jiraCloudInstance = process.argv[2] == null ? "wissenswandler" : process.argv[2];

// read user name and password from file ~/.jiracurl/user
// format: user:password
import fs from 'fs';
import path from 'path';
import os from 'node:os';
const userFile = path.join( os.homedir(), '.jiracurl', 'user' );
let atlassianUser = "";
let atlassianPassword = "";
try
{
    const user = fs.readFileSync( userFile  ).toString().split(':');
	atlassianUser = user[0].substring(3); // remove leading "-u " from file content
	// trim trailing newline from password
	atlassianPassword = user[1].substring(0, user[1].length - 1);
}
catch (error)
{
    console.warn( chalk.yellowBright(
`No user file found at ${userFile} - using anonymous access instead.
NOTE: this will only work for public information,
such as browsing Jira projects or Jira issues with 'anonymous' access privilege granted.`
));
}

var jiraclient = new jiraAPI({
    protocol: 'https',
    host: jiraCloudInstance + '.atlassian.net',
    username    : atlassianUser,
    password    : atlassianPassword,
    apiVersion: 'latest',
    strictSSL: true
});

// read jqlText from second command line argument or use default
const arg2 = process.argv[3];
const jqlText = arg2 == null ? "project=META" : arg2;

jiraclient
.searchJira
(   jqlText, 
    {   maxResults: 1000,
        fields : ['summary','description','issuetype','issuelinks','parent']
    }
)
.then
(   searchResult =>
{
    console.log(  KTS4Jira.jiraIssueArray2dotString( searchResult.issues )  )
}
)
.catch
(
    error => 
    {
        console.error(chalk.red(error));
        console.warn( chalk.yellowBright( "with jiraCloudInstance ==>" + jiraCloudInstance + "<== and jqlText ==>" + jqlText + "<==" ) );
    }   
);