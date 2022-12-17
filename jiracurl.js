// get list of issues from JIRA REST API using jql query

import jiraAPI from 'jira-client'
var jiraclient = new jiraAPI({
    protocol: 'https',
    host: 'knowhere.atlassian.net',
    username    : '',
    password    : '',
    apiVersion: '2',
    strictSSL: true
});

let k1l = jiraclient.searchJira
    (   'project = K1L', 
        {   maxResults: 1000,
            fields : ['summary']
        }
    ).then(issues => {

    // log the summary field of each issue
    issues.issues.forEach(issue =>
    {
        console.log( issue.key + " : " + issue.fields.summary )
    })
})