import jiraAPI from 'jira-client'
import KTS4Jira from './KTS4Jira.js';

var jiraclient = new jiraAPI({
    protocol: 'https',
    host: 'knowhere.atlassian.net',
    username    : '',
    password    : '',
    apiVersion: 'latest',
    strictSSL: true
});

let nodes=[];
let edges=[];

let k1l = jiraclient
    .searchJira
    (   'project = K1L', 
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