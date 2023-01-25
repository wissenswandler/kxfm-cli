/*
 * lightweight KTS lib (no dependencies)
 */

export default class KTS4SVG
{
	/*
	* rewrite GraphViz SVG to include KTS CSS and Javascript,
	* and to fix GraphViz bug: reverse <title> and first <g> tags so that title will be effective in browser
	*/
	static rewrite_GraphViz_SVG_to_KTS_SVG( svg, libPath = "https://wissenswandler.github.io/lib" )
	{
		if( ! (typeof svg === 'string')  ) 
		{
			console.debug( "SVG of type " + typeof svg + " = " + svg );
			throw new Error( "SVG is not of String type" );
		}

		// insert helptext placeholder before closing </svg> tag
		svg = svg.replace( /<\/svg>/ , '<foreignObject id="fo0" width="100%" height="100%" display="none"><div id="htmldiv" xmlns="http://www.w3.org/1999/xhtml" /></foreignObject></svg>' );

		// remove width and height attributes from <svg> tag as it causes unpredictable scaling (something like 50% larger than expected)
		svg = svg.replace( /<svg( (width|height)="\d+pt"){0,2}/g, '<svg' )

		const svgarray = svg.split(/\r?\n/);

		let swoppers = [8,9];
		// test whether line 9 consists of pattern ^<title>.+</title>$ ONLY and line 8 consists of pattern ^<g.+>$
		if
		(	
			svgarray[9].match(/^<title>.+<\/title>$/)
			&&
			svgarray[8].match(/^<g.+>$/)
		)
		{
			//console.debug( "swopping lines 9 + 8" );
			swoppers = [9,8];
		}
		else
		{
			//console.debug( "NOT swopping lines 9 + 8" );
		}

		return `${
			/*
			* keep <xml> preamble
			*/
			svgarray[0]}\n<?xml-stylesheet type="text/css" href="${libPath}/graph.css"?>\n${
			/*
			* keep next 7 lines
			*/
			svgarray.slice(1, 8).join("\n")}\n<script xlink:href="${libPath}/graph.js" type="text/ecmascript" />\n${
			/*
			* fix GraphViz bug: reverse <title> and first <g> tags so that title will be effective in browser
			*/
			svgarray[ swoppers[0] ]}\n${svgarray[ swoppers[1] ]}\n${
			/*
			* keep all the rest of SVG document
			*/
			svgarray.slice(10).join("\n")
		}`;
	}

    // escape html special characters
    // https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
	static escapeHtml(unsafe)
	{
		return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
	}	
}