#!/usr/bin/env node

/*
 * CLI entry into lightweight KTS lib
 */

import jira2dot from "./KTS4jira2dot.js";

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
        console.log( jira2dot.jiraIssueArray2dotString( issueArray , process.argv[2] )  );
    }
);