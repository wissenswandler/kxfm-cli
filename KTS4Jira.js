export default class KTS4Jira
{

/*
* convert Jira issue array to DOT string
* @param {Array} issueArray - array of Jira issues
* @returns {String} - DOT string
*/
static jiraIssueArray2dotString( issueArray, browsePath = "https://wissenswandler.atlassian.net/browse" )
{
    let tempString = 'digraph { rankdir=BT node[shape=box, style="rounded,filled" fillcolor=white] ';

    /*
     * render nodes first (otherwise references to nodes that are not yet defined will result in naked nodes)
     */
    issueArray.forEach(issue =>
    {
        tempString += "\n" 
            + "# self: " + issue.self + "\n"
            + "<" + issue.key + ">"
		    + " ["
	   	    + this.renderAttributeIfExists( "label"   , issue.fields.summary     )
            + this.renderAttributeIfExists( "tooltip" , issue.fields.description )
		    + this.renderURL( issue, browsePath )
		    + " ]";
    }
    );
    /*
     * render edges
     */
    issueArray.forEach(issue =>
    {
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

static renderURL( issue, browsePath = "https://wissenswandler.atlassian.net/browse" )
{
    const cloudInstanceMatcheR = /https:\/\/(.+)\.atlassian\.net\//g;
    const cloudInstanceMatcheS = [ ...issue.self.matchAll( cloudInstanceMatcheR ) ];

    if( cloudInstanceMatcheS )
    {
        browsePath = cloudInstanceMatcheS[0][0] + "browse";
    }
    else
    {
        console.warn( "could not extract cloud instance from issue.self: " + issue.self );
        console.warn( "using supplied / default browsePath: " + browsePath);
    }

	return " URL=\"" + browsePath + "/" + issue.key + "\""
}

static renderAttributeIfExists( name, value )
{
    const  safeValue = this.safeAttribute( value );
    return safeValue == "" ? "" : " " + name + "=\"" + safeValue + "\""
}

/*
 * return a string that is safe to use as a label in a DOT file
 * by replacing double quotes with escaped double quotes
 * @param {String} text - text to be used as a label (NOTE it could also be an ADO)
 * @returns {String} - safe text to be used as a label which is delimited by double quotes(!)
 */
static safeAttribute( text )
{
    if( text == null )
    {
        //console.warn( "found a NULL text (which is OK)" );
        return "";
    } 
    if( typeof text === "object" )
    {
        /* this could be an Atlassian Document Object (ADO) e.g. like that:
        */
        const ado =
        {
            "version":1,
            "type":"doc",
            "content":
            [
                {
                    "type":"paragraph",
                    "content":
                    [
                        {
                            "type":"text",
                            "text":"Typ-1 Hypervisor (native / bare metal)"
                        }
                    ]
                }
            ]
        };
        console.warn( "found a text OBJECT (that is not null) and don't know how to handle that, returning empty string: " + JSON.stringify( text ) );
        return "";
    }
    if( ! typeof text.replace === "function" )
    {
        console.warn( "found a text that is not a function and don't know how to handle that, returning empty string: " + JSON.stringify( text ) );
        return "";
    }
    try
    {
        return text.replace( /"/g, "\\\"" )
    }
    catch( error )
    {
    	console.error( error );
	    console.warn( "typeof text: " + typeof text );
    	return "";
    }
}

} // end of class KTS4Jira