/*
 CLI to fetch from Jira Cloud REST API

 @param {String} jiraCloudInstance - Jira Cloud instance name
 @param {String} jqlText - JQL query text
 @returns {Array} - array of Jira issues with a limited set of fields
 
 results could be piped to jiraIssueArray2dotString.js in order to create a GraphViz DOT file
 */

import jiraAPI from 'jira-client'
import chalk from 'chalk';
import JiraExtract from './JiraExtract.js';

// read Jira Cloud instance name from first command line argument, **/DIR, or use default
let jiraCloudInstance = null;
if( process.argv[2] )
{
    jiraCloudInstance = process.argv[2];
}
else
{
    // test whether current dir name contains dots (Copilot)
    jiraCloudInstance = JiraExtract.find_instance_name(  process.cwd().split( path.sep )  );
    if( jiraCloudInstance )
    {
        console.warn( chalk.grey( `assuming Jira Cloud instance name "${jiraCloudInstance}" from DIR (supply instance name as 1. parameter if needed)` ) )
    }
    else
    {
        jiraCloudInstance = "knowhere";
        console.warn( chalk.yellowBright( `using hardcoded default "${jiraCloudInstance}" as Jira Cloud instance (supply instance name as 1. parameter OR change to a dotted DIR)` ) )
    }    
}

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
    const userfile_content = fs.readFileSync( userFile ).toString();
    try
    {
        const user_and_pwd = userfile_content.split(':');
        atlassianUser = user_and_pwd[0].substring(3); // remove leading "-u " from file content
        // trim trailing newline from password
        atlassianPassword = user_and_pwd[1].substring(0, user_and_pwd[1].length - 1);
    }
    catch (error)
    {
        console.warn( chalk.grey(
        `No user/pwd found in ${userFile} - using anonymous access instead. Use "-u <user>:<password>" (same syntax as for cURL) in file ${userFile} to supply credentials IF you want to authenticate. See https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/`
        ));
    }
}
catch (error)
{
    console.warn( chalk.yellowBright(
    `No userfile found at ${userFile} - using anonymous access instead. NOTE: this will only work for public information. Create file ${userFile} IF you want to authenticate.`
    ));
}

/*
 * NOTE: apiVersion 'latest' seems to be interpreted as '2', at least in case of /search operation!
 * 2/search returns multi-line text fields (such as description) of type String, whereas
 * 3/search and latest/search return multi-line text fields of ADO type JSON object (see comment below)
 */
var jiraclient = new jiraAPI({
    protocol: 'https',
    host: jiraCloudInstance + '.atlassian.net',
    username    : atlassianUser,
    password    : atlassianPassword,
    apiVersion: '2', // see NOTE above
    strictSSL: true
});


// read jqlText from second command line argument or construct from DIR name
const arg2 = process.argv[3];
let jqlText = arg2;
if( !jqlText )
{
    jqlText = `project=${process.cwd().split( path.sep ).pop()}`;
    console.warn( chalk.grey( `assuming query text "${jqlText}" from DIR (supply complete query as 2. parameter if needed)` ) )
}


jiraclient
.searchJira
(   jqlText, 
    {   maxResults: 1000,
        fields : ['summary','description','issuetype','issuelinks','parent','status']
    }
)
.then
(   searchResult =>
{
    console.log( JSON.stringify( searchResult.issues )  )
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