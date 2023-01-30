/*
 * lightweight KTS lib (no dependencies)
 */

import KTS4SVG from "./KTS4SVG.js";


const arrowUp = "▲";
const arrowDn = "▼";

/*
 * a Set of unqiue objects
 * where identity is defined by the unique_by property
 */
class UniqueSet extends Map
{
  static get unqiue_by() { return "id"; }

  add (o) 
  {
    let currentItem = this.get( o[ UniqueSet.unqiue_by ] );

    if (currentItem)
    {
        if (this.deepCompare(o, currentItem))
            throw( "refusing: " + o[ UniqueSet.unqiue_by ] );
    }

    // log the length of the o.fields object [Copilot]
    //console.warn( "adding: " + o.key + " with " + Object.keys(o.fields).length + " fields" );
    //console.warn( "adding: " + o.id );

    this.set( o[ UniqueSet.unqiue_by ], o );

    return this;
  };

  deepCompare(o, i)
  {
    // TODO: theoretically handle the case of replacing an issue with less details with one with more details;
    // However, as long as 'issues' are harvested first, then linked issues, we always receive the more detailed issue first
    // so, practically we will never have to deal with such replacement
    //return o.key == i.key && Object.keys(o.fields).length <= Object.keys(i.fields).length;

    return o[ UniqueSet.unqiue_by ] == i[ UniqueSet.unqiue_by ]
  }

  set( k, v)
  {
    this.decorate( v );
    super.set( k, v );
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
    o.isMeta = meta;

    let base_dot_style = (meta ? "filled" : "filled,rounded");
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
static jiraIssueArray2dotString( issueArray, jiraInstance )
{
    const issueSet = new JiraIssueSet( issueArray.map( (i) => [ i.id, i ] ) );
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

                            link.o_id = issue.id;
                            link.s_id = link.outwardIssue.id;
                            delete link.outwardIssue;
                            this.safeAdd( linkSet, link );
                        }
                        if( link.inwardIssue )
                        {
                            this.safeAdd( issueSet, link.inwardIssue );

                            link.s_id = issue.id;
                            link.o_id = link.inwardIssue.id;
                            delete link.inwardIssue;
                            this.safeAdd( linkSet, link );
                        }
                    }
                );
            }
        }
    );

    //console.warn("issueSet.size: " + issueSet.size);

    return this.jiraGraph2dotString( { nodes: issueSet, edges: linkSet }, jiraInstance );
}

/*
 * a Jira Graph is a set of Nodes and a set of Edges, both in Jira API shape
 */
static jiraGraph2dotString( jiraGraph, jiraInstance )
{
    let tempString = `digraph Map {
graph [
    class="kts-generated"
#   nodesep=0.2
#   ranksep=0.2
]
node [
   margin=0.1
]`;

    /*
     * render nodes first (otherwise references to nodes that are not yet defined will result in naked nodes)
     */
    jiraGraph.nodes.forEach
    //(   key_value_pair =>
    (   issue =>
        {
            //let issue = key_value_pair[1];

            //
            // node definition
            //
            tempString += "\n\n" 
                + "# self: " + issue.self + "\n"
                + "<" + issue.key + ">"
                + " [ "
                + this.renderHtmlLabel( issue, jiraInstance )
                + this.renderAttributeIfExists( "tooltip" , issue.fields.description )
                + this.renderURL( issue, jiraInstance )
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

    tempString += "\n";

    // create array from edges map
    let edges = Array.from( jiraGraph.edges.values() )

    // sort edges by link type
    .sort( (a,b) => (a.type.id < b.type.id) ? -1 : (a.type.id > b.type.id) ? 1 : 0  );

    let groupedEdges = edges.reduce // group edges by type
    (   (acc, link) =>
        {
            let key = link.type.id;
            if( !acc[key] )
                acc[key] = [];
            acc[key].push( link );
            return acc;
        }
    ,   {}
    );

    // ieteate over grouped edges
    Object.keys( groupedEdges ).forEach
    (   linkTypeId =>
        {
            let group = groupedEdges[ linkTypeId ];

            let p = group[0].type;
            let  inwardLabel =  p.inward.replace("▲","");
            let outwardLabel = p.outward.replace("▼","");

            let predicateNameParts = p.name.split( " -- style: " );
            let predicateName = predicateNameParts[0];
            let style = predicateNameParts[1];

            /*
             * render link type definition
             */
            tempString += '\n{'
            + ' edge ['
            + (style ? style : this.renderAttributeIfExists( "label" , inwardLabel ) )
            + ']'
            + ' # link type: "' + predicateName + '"'

            /*
            * render edges
            */
            group.forEach
            (   link =>
                {
                    let s = jiraGraph.nodes.get( link.s_id );
                    let o = jiraGraph.nodes.get( link.o_id );

                    let tooltip = `${o.fields.summary} → ${inwardLabel} → ${s.fields.summary} → ${outwardLabel} → ${o.fields.summary}` ;
                    tempString += `\n<${s.key}> -> <${o.key}>`
                    + "["
                    + 'labeltooltip="' + this.safeAttribute( tooltip ) + '"'
                    +     ' tooltip="' + this.safeAttribute( tooltip ) + '"'
                    + "]";
                }
            );

            /*
             * end of link type definition
             */
            tempString += "\n}";
        }
    );


    return tempString + "\n}";
}

static renderHtmlLabel( issue, jiraInstance )
{
    let typeSearchAttribute = "";
    if( issue.isMeta )
    {
        const typeSearchUrl = "https://" + this.jiraInstanceFromIssueOrParameter(issue,jiraInstance) + "/issues/?jql=type=" + issue.fields.issuetype.id + "+ORDER+BY+summary";
        typeSearchAttribute = ` HREF="${typeSearchUrl}"`;
    }

/*
 * NOTE: keeping the IMG tag in one line with TD tag is important, otherwise the IMG tag will be ignored!!
 * see https://github.com/hpcc-systems/hpcc-js-wasm/issues/145
 */
    return `label=
<<TABLE BORDER="0" CELLSPACING="0"> <TR>
  <TD CELLPADDING="0"${typeSearchAttribute}><IMG SRC="${issue.fields.issuetype.iconUrl}" /></TD>
  <TD COLSPAN='3'>${KTS4SVG.escapeHtml( issue.fields.summary )}</TD>
 </TR> <TR>
  <TD${typeSearchAttribute} COLSPAN="2" SIDES="LBR" ALIGN="LEFT"><I><FONT POINT-SIZE='8'>${issue.fields.issuetype.name}</FONT></I></TD>
  <TD><FONT POINT-SIZE='8'>${issue.fields.status.name}</FONT></TD>
  <TD ALIGN='RIGHT'><FONT POINT-SIZE='8'>${issue.key}</FONT></TD>
</TR> </TABLE>>`;
}

static jiraInstanceFromIssueOrParameter( issue, jiraInstance )
{
    return this.jiraInstanceFromIssue( issue ) || jiraInstance;
}
static jiraInstanceFromIssue( issue )
{
    const cloudInstanceMatcheR = /https:\/\/(\w+\.atlassian\.net)\//g;
    const cloudInstanceMatcheS = [ ...issue.self.matchAll( cloudInstanceMatcheR ) ];

    if( cloudInstanceMatcheS && cloudInstanceMatcheS[0] )
    {
        return cloudInstanceMatcheS[0][1];
    }
    else
        return null;
}

static renderURL( issue, jiraInstance )
{
    let browsePath;

    const cloudInstanceMatcheR = /https:\/\/\w+\.atlassian\.net\//g;
    const cloudInstanceMatcheS = [ ...issue.self.matchAll( cloudInstanceMatcheR ) ];

    if( cloudInstanceMatcheS && cloudInstanceMatcheS[0] )
    {
        browsePath = cloudInstanceMatcheS[0][0] + "browse";
    }
    else
    {
        if( !jiraInstance )
        {  
            jiraInstance = "knowhere.atlassian.net";
            console.warn( "could not extract instance name from issue.self: " + issue.self );
            console.warn( "and no instance name supplied via parameter" );
            console.warn( "using default instance name FOR TESTING PURPOSES: " + jiraInstance );
        }
        browsePath = "https://" + jiraInstance + "/browse"
	/*
	 * issue records which are retrieved on Forge server contain self value like following pattern:
	 * https://api.atlassian.com/ex/jira/03f3ce7b-7d4b-4363-9370-9e6917312a51/rest/api/2/issue/10597
	 */
        // console.warn( "could not extract cloud instance from issue.self: " + issue.self );
        // console.warn( "using supplied browsePath: " + browsePath);
    }

	return " URL=\"" + browsePath + "/" + issue.key + "\""
}

static renderAttributeIfExists( name, value )
{
    const  safeValue = this.safeAttribute( value );
    return safeValue == "" ? "" : ` ${name}=\"${safeValue}\"`   // mind the leading space to separate attributes in DOT string
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