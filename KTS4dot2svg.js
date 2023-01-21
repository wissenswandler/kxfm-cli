/*
 * still heavyweight and implementation-dependent
 * TODO: refactor into interface + different implementations in separate packages
 */
// DONT chalk because it does not work in Forge FaaS
import KTS4SVG from './KTS4SVG.js';
import KTS4Dot from './KTS4Dot.js';

import { Graphviz } from "@hpcc-js/wasm/graphviz";
const graphviz = await Graphviz.load();

// standard image size to be used for both dimensions
export const IMAGE_SIZE = 32;

export default 
{
/*
 * build diagram from DOT source string
 *
 * the source string is decorated to include KTS specific attributes
 * for generating navigable SVG
 * 
 * the resulting SVG is decorated with KTS specific CSS and Javascript, to be used as a stand-alone SVG in a browser
 */
build_diagram_from_string( dot_string, libPath )
{
	let regex = /IMG\s*SRC\s*=\s*"([^"]*)"/g;
	let imageUrlArray = Array.from(dot_string.matchAll(regex)).map((match) => match[1]);
    // create an array with entries of form { path:"", width:"16px", height:"16px" } for every entry of input array [Copilot]
    let imageAttributeArray = imageUrlArray.map(  image => ({ path: image, width: IMAGE_SIZE+'px', height: IMAGE_SIZE+'px' }) );

	let kts_dot = KTS4Dot.preprocess(dot_string);

	let unflat_dot = graphviz.unflatten( kts_dot, 5, true, 5);
	console.warn( "unflat dot:\n" + unflat_dot );

	let svg = null;
	try
	{
		svg = graphviz.dot( unflat_dot, "svg", { images: imageAttributeArray } );
	}
	catch (e)
	{
		// DONT chalk because it does not work in Forge FaaS
		console.error( e.stack );
		console.error( "with following (preprocessed) DOT source:\n~~~~~~~~\n" + kts_dot + "\n~~~~~~~~" );
		console.error( "returning error SVG instead of crashing...\n~~~~~~~~" );
		return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
 <text x="50" y="50" text-anchor="middle" alignment-baseline="middle" font-size="0.1em" fill="darkred">error (in DOT source?): ${e.message} </text>
</svg>`;
	}
	return KTS4SVG.rewrite_GraphViz_SVG_to_KTS_SVG( svg, libPath );
}
}
