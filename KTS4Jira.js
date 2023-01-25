/*
 * lightweight KTS lib (no dependencies)
 */

import KTS4SVG from "./KTS4SVG.js";

/*
 * a Set of unqiue objects
 * where identity is defined by the unique_by property
 */
class UniqueSet extends Set
{
  static get unqiue_by() { return "id"; }

  add (o) 
  {
    this.forEach
    (   i =>
        {
            if (this.deepCompare(o, i))
                throw( "refusing: " + o[ UniqueSet.unqiue_by ] );
        }
    );
    // log the length of the o.fields object [Copilot]
    //console.warn( "adding: " + o.key + " with " + Object.keys(o.fields).length + " fields" );

    this.decorate( o );

    super.add.call(this, o);
    return this;
  };

  deepCompare(o, i)
  {
    // TODO: theoretically handle the case of replacing an issue with less details with one with more details
    // assuming that 'issues' are harvested first, then linked issues, we always receive the more detailed issue first
    // so, practically we will never have to deal with such replacement
    //return o.key == i.key && Object.keys(o.fields).length <= Object.keys(i.fields).length;

    return o[ UniqueSet.unqiue_by ] == i[ UniqueSet.unqiue_by ]
  }
  
  /*
   * optionally modify o
   * after it has been accepted,
   * but before it is added to the set
   */
  decorate( o )
  {
    // not implemented in base class
  }
}
/*
 * a Set of unqiue, detailed Jira issues
 * where an issue with more details (fields) is preferred over a less detailed one
 */
class JiraIssueSet extends UniqueSet
{
  /*
   * decoreate the issue with a style
   */
  decorate( o )
  {
    // test whether o.key contains the text "META" [Copilot]
    let meta = o.key.includes("META");
    let base_dot_style = meta ? "filled" : "filled,rounded";
    switch( o.fields.status.statusCategory.id )
    {
        case 3:
            o.dot_style = base_dot_style + ",dashed";
            break;
        case 2:
            o.dot_style = base_dot_style + ",dotted";
            break;
        case 1: // never seen in the wild, so mark it bold to stand out visually
            o.dot_style = base_dot_style + ",bold";
            break;
        default: // in particular == 4
            o.dot_style = base_dot_style;
    }
  }
}

class JiraIssueLinkSet extends UniqueSet
{

}

export default class KTS4Jira
{

static safeAdd( set, o )
{
    try
    {
        set.add( o );
    }
    catch( e )
    {
        //console.warn( e );
    }
}

/*
* convert Jira issue array to DOT string
* @param {Array} issueArray - array of Jira issues
* @returns {String} - DOT string
*/
static jiraIssueArray2dotString( issueArray, browsePath )
{
    //put all issues from array into a unique set [Copilot]
    const issueSet = new JiraIssueSet( issueArray );
    const linkSet  = new JiraIssueLinkSet();   

    // add all issues from issuelinks to the set [mostly Copilot]
    // and add all links to the link set
    issueArray.forEach
    (   issue =>
        {
            if( issue.fields.parent )
                this.safeAdd( issueSet, issue.fields.parent );

            if( issue.fields.issuelinks )
            {
                issue.fields.issuelinks.forEach
                (   link =>
                    // TODO: reverse "type 2" links
                        
                    // note that traditional Jira semantics are in "dependency" direction,
                    // which is the opposite of "value" direction,
                    // so it appears that we reverse the direction of the edge by drawing it from the outwardIssue to the inwardIssue
                    {
                        if( link.outwardIssue )
                        {
                            this.safeAdd( issueSet, link.outwardIssue );

                            link.o_key = issue.key;
                            link.s_key = link.outwardIssue.key;
                            delete link.outwardIssue;
                            this.safeAdd( linkSet, link );
                        }
                        if( link.inwardIssue )
                        {
                            this.safeAdd( issueSet, link.inwardIssue );

                            link.s_key = issue.key;
                            link.o_key = link.inwardIssue.key;
                            delete link.inwardIssue;
                            this.safeAdd( linkSet, link );
                        }
                    }
                );
            }
        }
    );

    //console.warn("issueSet.size: " + issueSet.size);

    return this.jiraGraph2dotString( { nodes: issueSet, edges: linkSet }, browsePath );
}

/*
 * a Jira Graph is a set of Nodes and a set of Edges, both in Jira API shape
 */
static jiraGraph2dotString( jiraGraph, browsePath )
{
    let tempString = `digraph Map {
graph [
#   nodesep=0.2
#   ranksep=0.2
]
node [
#   margin=0.1
]`;

    /*
     * render nodes first (otherwise references to nodes that are not yet defined will result in naked nodes)
     */
    jiraGraph.nodes.forEach
    (   issue =>
        {
            //
            // node definition
            //
            tempString += "\n" 
                + "# self: " + issue.self + "\n"
                + "<" + issue.key + ">"
                + " [ "
                + this.renderHtmlLabel( issue )
                + this.renderAttributeIfExists( "tooltip" , issue.fields.description )
                + this.renderURL( issue, browsePath )
                + this.renderAttributeIfExists( "style" , issue.dot_style ) // [Copilot !!]
                + " ]";

            //
            // optional 'parent' edge
            //
            if( issue.fields.parent )
            {
                tempString += "\n<" + issue.key + "> -> <" + issue.fields.parent.key + ">";
            }
        }
    );

    /*
     * render edges
     */
    jiraGraph.edges.forEach
    (   link =>
        {
            tempString += "\n<" + link.s_key + "> -> <" + link.o_key + ">";
        }
    );

    return tempString + "\n}";
}

static renderHtmlLabel( issue )
{
    const typeSearchUrl = "https://knowhere.atlassian.net/issues/?jql=type=" + issue.fields.issuetype.id + "+ORDER+BY+summary";

/*
 * NOTE: keeping the IMG tag in one line with TD tag is important, otherwise the IMG tag will be ignored!!
 * see https://github.com/hpcc-systems/hpcc-js-wasm/issues/145
 */
    return `label=
<<TABLE BORDER="0" CELLSPACING="0"> <TR>
  <TD CELLPADDING="0" HREF="${typeSearchUrl}"><IMG SRC="${issue.fields.issuetype.iconUrl}" /></TD>
  <TD COLSPAN='3'>${KTS4SVG.escapeHtml( issue.fields.summary )}</TD>
 </TR> <TR>
  <TD HREF="${typeSearchUrl}" COLSPAN="2" SIDES="LBR" ALIGN="LEFT"><I><FONT POINT-SIZE='8'>${issue.fields.issuetype.name}</FONT></I></TD>
  <TD><FONT POINT-SIZE='8'>${issue.fields.status.name}</FONT></TD>
  <TD ALIGN='RIGHT'><FONT POINT-SIZE='8'>${issue.key}</FONT></TD>
</TR> </TABLE>>`;
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
        */
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
