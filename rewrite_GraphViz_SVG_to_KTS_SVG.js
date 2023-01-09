/*
 * rewrite GraphViz SVG to include KTS CSS and Javascript,
 * and to fix GraphViz bug: reverse <title> and first <g> tags so that title will be effective in browser
 */
export function rewrite_GraphViz_SVG_to_KTS_SVG( svg, libPath = "https://wissenswandler.github.io/lib" )
{
	if( ! (typeof svg === 'string')  ) 
	{
		console.debug( "SVG of type " + typeof svg + " = " + svg );
		throw new Error( "SVG is not of String type" );
	}

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
		svgarray.slice(10).join("\n")}`;
}