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
        tempString += "\n<" + issue.key + "> [label=\"" + this.safeLabel( issue.fields.summary ) + "\"]";
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

/*
 * return a string that is safe to use as a label in a DOT file
 * by replacing double quotes with escaped double quotes
 * @param {String} text - text to be used as a label
 * @returns {String} - safe text to be used as a label which is delimited by double quotes(!)
 */
static safeLabel( text )
{
    return text.replace( /"/g, "\\\"" )
}

}