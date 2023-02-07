#!/usr/bin/env node

/*
 * CLI entry into lightweight KTS lib
 */

import KTS4Jira from "./KTS4Jira.js";

let input = "";
process.stdin.on
(   "data",
    (chunk) =>
    {
        input += chunk;
    }
);
process.stdin.on
(   "end",
    () =>
    {
        const issueArray = JSON.parse(input);
        console.log( KTS4Jira.jiraIssueArray2dotString( issueArray , process.argv[2] )  );
    }
);