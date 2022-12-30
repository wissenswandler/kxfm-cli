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
    issueArray.forEach(issue =>
    {
        tempString += "\n<" + issue.key + ">"
		    + " ["
	   	    + this.renderAttributeIfExists( "label"   , issue.fields.summary     )
            + this.renderAttributeIfExists( "tooltip" , issue.fields.description )
		    + " URL=\"https://wissenswandler.atlassian.net/browse/" + issue.key + "\""
		    + " ]";
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

static renderAttributeIfExists( name, value )
{
    const  safeValue = this.safeAttribute( value );
    return safeValue == "" ? "" : " " + name + "=\"" + safeValue + "\""
}

/*
 * return a string that is safe to use as a label in a DOT file
 * by replacing double quotes with escaped double quotes
 * @param {String} text - text to be used as a label
 * @returns {String} - safe text to be used as a label which is delimited by double quotes(!)
 *
 * surprisingly throws an error (which is caught) only in a FORGE environment (not in node.js 18)
 * if text is "empty":
 *  TypeError: text.replace is not a function
 *  typeof text: object
 * This case gets caught in a NODE.JS environment by the expression !text .
 */
static safeAttribute( text )
{
    try
    {
        return (text && typeof text.replace === "function" ) ? text.replace( /"/g, "\\\"" ) : ""
    }
    catch( error )
    {
	console.error( error );
	console.debug( "typeof text: " + typeof text );
	return ""
    }
}

} // end of class KTS4Jira