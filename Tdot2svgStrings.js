/*
 * lightweight KTS lib for all environments
 * graphviz implementation must be initialized externally (CLI, Browser)
 *
 * don't chalk here because it does not work in Forge FaaS logging
 */
import KTS4SVG from './KTS4SVG.js';
import KTS4Dot from './KTS4Dot.js';

// standard image size to be used for both dimensions
export const IMAGE_SIZE = 16;

export default class Tdot2svgStrings
{
	graphviz = null;

	constructor( graphvizImplementation	)
	{
		if( graphvizImplementation == null )
			throw new Error( "graphvizImplementation must not be null" );

		this.graphviz = graphvizImplementation;
	}

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

	let unflat_dot = this.graphviz.unflatten( kts_dot, 5, true, 5);
	
	let svg = null;
	try
	{
		svg = this.graphviz.dot( unflat_dot, "svg", { images: imageAttributeArray } );
		try
		{
			return KTS4SVG.rewrite_GraphViz_SVG_to_KTS_SVG( svg, libPath );
		}
		catch (e)
		{
			// DONT chalk because it does not work in Forge FaaS
			console.error( e.stack );
			console.error( "... while post-processing SVG:\n~~~~~~~~\n" + svg + "\n~~~~~~~~" );
			console.error( "returning error SVG instead of crashing...\n~~~~~~~~" );
			return Tdot2svgStrings.simple_svg_from_error( e );
		}
	}
	catch (e)
	{
		// DONT chalk because it does not work in Forge FaaS
		console.error( e.stack );
		console.error( "... with following preprocessed + unflattened DOT source:\n~~~~~~~~\n" + kts_dot + "\n~~~~~~~~" );
		console.error( "returning error SVG instead of crashing...\n~~~~~~~~" );
		return Tdot2svgStrings.simple_svg_from_error( e );
	}
}

static simple_svg_from_error( e )
{
	return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
 <text x="50" y="50" text-anchor="middle" alignment-baseline="middle" font-size="0.1em" fill="darkred">error (in DOT source?): ${e.message} </text>
</svg>`;
}

static render( dot_string, elmId )
{
  // see HEIGHT HACK below
  let clientHeight = document.querySelector( "body" ).clientHeight;
  
  // parse the dot string for image URLs
  let regex = /IMG\s*SRC\s*=\s*"([^"]*)"/g;
  let imageUrlArray = Array.from(dot_string.matchAll(regex)).map((match) => match[1]);

  // create an array with entries of form { path:"", width:"16px", height:"16px" } for every entry of input array [C]
  const IMAGE_SIZE = 16;
  let imageAttributeArray = imageUrlArray.map(  image => ({ path: image, width: IMAGE_SIZE+'px', height: IMAGE_SIZE+'px' }) );

  let unflat_dot = graphviz.unflatten( dot_string, 5, true, 5);

  let svgdoc = graphviz.dot(	unflat_dot,	"svg", {   images: imageAttributeArray } ) ;
  let svgtag = svgdoc
                .slice( svgdoc.indexOf( "<svg" ) )
                .replace( /svg width="\d+pt" /g, 'svg width="100%"' ); // height attribute does not support 100% and will set to default of 150px if missing: so we keep it

  document.getElementById( elmId ).innerHTML = svgtag;

  // weird HEIGHT HACK against the inflated height in form of an SVGAnimatedLength;
  // found the scaling factor /4 * 3 by observation and experiment
  // the goal is to set the SVG element to "100%" of the available height
  document.querySelector( "svg").setAttribute("height", ( clientHeight / 4 * 3) + "pt") 
}

} // end of module.exports