/*
 * lightweight KTS lib (no dependencies)
 */

export default class KTS4Dot
{
/*
 * add some required and some recommended attributes to the DOT string
 *
 * also scan for image urls and return them in an array
 */
static preprocess(dot_string)
{
    return dot_string.replace
    (
        /(graph.*\{)/
        ,
        `$1
graph [
    color=whitesmoke
    fontname=Helvetica
    labelloc=b
    rankdir=BT
    remincross=true
    splines=true
    style="filled,rounded"
    target=details
    tooltip=""
]
node [ id="\\N"
    fillcolor=white
    fontname=Helvetica
    height=0
    shape=box
    style="filled,rounded"
    target=details
    tooltip=""
    width=0
]
edge [ id="\\T___\\H"
    arrowtail=none
    color=forestgreen
    dir=both
    fontsize=10
    penwidth=2
    target=details
    tooltip=" "
	 labeltooltip=" "
	  headtooltip=" "     
	  tailtooltip=" "
]
`		);
};

/*
 * return an attribute name/value IF value ist not empty,
 * otherwise return an empty string
 */
static renderAttributeIfExists( name, value )
{
    const  safeValue = KTS4Dot.safeAttribute( value );
    return safeValue == "" ? "" : ` ${name}=\"${safeValue}\"`   // mind the leading space to separate attributes in DOT string
}

/*
 * return a string that is safe to use as a DOT language attribute
 * by replacing double quotes with escaped double quotes
 * @param {String} text - text to be used as a label (NOTE it could also be an ADO)
 * @returns {String} - safe text to be used as a label which is delimited by double quotes(!)
 */
static safeAttribute( value )
{
    if( value == null )
    {
        //console.warn( "found a NULL text (which is OK)" );
        return "";
    } 
    if( typeof value === "object" )
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
        console.warn( "found a text OBJECT (that is not null) and don't know how to handle that, returning empty string: " + JSON.stringify( value ) );
        return "";
    }
    if( ! typeof value.replace === "function" )
    {
        console.warn( "found a text that is not a function and don't know how to handle that, returning empty string: " + JSON.stringify( value ) );
        return "";
    }
    try
    {
        return value.replace( /"/g, "\\\"" )
    }
    catch( error )
    {
    	console.error( error );
	    console.warn( "typeof text: " + typeof value );
    	return "";
    }
}

} // end of class KTS4Dot