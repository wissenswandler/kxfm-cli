/*
 * lightweight KTS lib (no dependencies)
 */

export default class KTS4Jira
{

// standard image size to be used for both dimensions
static IMAGE_SIZE = 32;

/*
* convert Jira issue array to DOT string
* @param {Array} issueArray - array of Jira issues
* @returns {String} - DOT string
*/
static jiraIssueArray2dotString( issueArray, browsePath )
{
    let tempString = `digraph Map {
graph [
#   nodesep=0.2
#   ranksep=0.2
]
node [
#   margin=0.1
]`;

    let images = [];

    /*
     * render nodes first (otherwise references to nodes that are not yet defined will result in naked nodes)
     */
    issueArray.forEach(issue =>
    {
        tempString += "\n" 
            + "# self: " + issue.self + "\n"
            + "<" + issue.key + ">"
		    + " [ "

	   	    //+ this.renderAttributeIfExists( "label"   , issue.fields.summary     )
            + this.renderHtmlLabel( issue )

            + this.renderAttributeIfExists( "tooltip" , issue.fields.description )
		    + this.renderURL( issue, browsePath )
		    + " ]";

        // adding issue.fields.issuetype.iconUrl to images array if not already present
        if( issue.fields.issuetype.iconUrl && !images.includes( issue.fields.issuetype.iconUrl ) )
        {
            images.push( issue.fields.issuetype.iconUrl );
        }
    }
    );

    /*
     * render edges
     */
    issueArray.forEach
    (   issue =>
        {
            const k = issue.key;
            issue.fields.issuelinks.forEach
            (   link => 
                {
                    if (link.inwardIssue)
                    {
                        tempString += "\n<" + k + "> -> <" + link.inwardIssue.key + ">";
                    }
                }
            );
            if( issue.fields.parent )
            {
                tempString += "\n<" + k + "> -> <" + issue.fields.parent.key + ">";
            }
        }
    );

    console.warn( `${images.length} images: \n${ JSON.stringify( this.wasmArray(images.sort()) ) }` );

    return tempString + "\n}";
}

static wasmArray( imageArray )
{
    // create an array with entries of form { path:"", width:"16px", height:"16px" } for every entry of input array [Copilot]
    return imageArray.map( image => ({ path: image, width: ""+this.IMAGE_SIZE+"px", height: ""+this.IMAGE_SIZE+"16px" }) );
}

static renderHtmlLabel( issue )
{
    const typeSearchUrl = "https://knowhere.atlassian.net/issues/?jql=type=" + issue.fields.issuetype.id + "+ORDER+BY+summary";

    // escape html special characters
    // https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
    const escapeHtml = (unsafe) => {
        return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;" )
                .replace(/>/g, "&gt;" )
    };

/*
 * NOTE: keeping the IMG tag in one line with TD tag is important, otherwise the IMG tag will be ignored!!
 * see https://github.com/hpcc-systems/hpcc-js-wasm/issues/145
 */
    return `label=
<<TABLE BORDER="0" CELLSPACING="0">
 <TR>
  <TD WIDTH="18" HEIGHT="18" FIXEDSIZE="TRUE" CELLPADDING="0" VALIGN="TOP" HREF="${typeSearchUrl}"><IMG SRC="${issue.fields.issuetype.iconUrl}" /></TD>
  <TD COLSPAN='3'><B>${escapeHtml( issue.fields.summary )}</B></TD>
 </TR>
 <TR>
  <TD HREF="${typeSearchUrl}" COLSPAN="2" SIDES="LBR" ALIGN="LEFT"><I><FONT POINT-SIZE='8'>${issue.fields.issuetype.name}</FONT></I></TD>
  <TD><FONT POINT-SIZE='8'>${issue.fields.status.name}</FONT></TD>
  <TD ALIGN='RIGHT'><FONT POINT-SIZE='8'>${issue.key}</FONT></TD>
</TR>
</TABLE>>`;
}

static renderURL( issue, browsePath = "https://knowhere.atlassian.net/browse" )
{
    const cloudInstanceMatcheR = /https:\/\/(.+)\.atlassian\.net\//g;
    const cloudInstanceMatcheS = [ ...issue.self.matchAll( cloudInstanceMatcheR ) ];

    if( cloudInstanceMatcheS && cloudInstanceMatcheS[0] )
    {
        browsePath = cloudInstanceMatcheS[0][0] + "browse";
    }
    else
    {
	/*
	 * issue records which are retrieved on Forge server contain self value like following pattern:
	 * https://api.atlassian.com/ex/jira/03f3ce7b-7d4b-4363-9370-9e6917312a51/rest/api/2/issue/10597
	 */
        // console.warn( "could not extract cloud instance from issue.self: " + issue.self );
        // console.warn( "using supplied / default browsePath: " + browsePath);
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
