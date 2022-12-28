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

console.info(chalk.green("reading issue array from stdin. Type CTRL-D to signal end of your input..."));

process.stdin.resume();
process.stdin.setEncoding('utf8');
// read from stdin
let stdin = "";
process.stdin.on('data', function (chunk) {
    stdin += chunk;
});
process.stdin.on('end', function () {
    const svg = build_diagram_from_string(stdin);
    return console.log(svg);
});