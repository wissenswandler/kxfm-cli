export default class KTS4Jira
{

/*
* convert Jira issue array to DOT string
* @param {Array} issueArray - array of Jira issues
* @returns {String} - DOT string
*/
static jiraIssueArray2dotString( issueArray )
{
    let tempString = "digraph { rankdir=BT ";
    issueArray.forEach(issue => {
        tempString += "\n<" + issue.key + "> [label=\"" + issue.fields.summary + "\"]";
        const k = issue.key;
        issue.fields.issuelinks.forEach(link => {
            if (link.inwardIssue) {
                tempString += "\n<" + k + "> -> <" + link.inwardIssue.key + ">";
            }
        }
        );
    }
    );
    return tempString + "\n}";
}

}