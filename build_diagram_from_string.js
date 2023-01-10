import chalk from 'chalk';
import { rewrite_GraphViz_SVG_to_KTS_SVG } from './rewrite_GraphViz_SVG_to_KTS_SVG.js';

import graphviz from 'graphviz-wasm';
await  graphviz.loadWASM();

/*
 * build diagram from DOT source string
 *
 * the source string is modified to include KTS specific attributes
 * for generating navigable SVG
 * 
 * the resulting SVG is extended with KTS specific CSS and Javascript
 */
export function build_diagram_from_string( dot_string, libPath )
{
	const kts_dot_string = // insert text in dot_string after the first opening brace
		dot_string.replace
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
    tooltip=" "
]
node [ id="\\N"
    fillcolor=white
    fontname=Helvetica
    height=0
    shape=box
    style="filled,rounded"
    target=details
    tooltip=" "
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
]`		);
	
	let svg = null;

	// catch layout errors
	try
	{
		svg = graphviz.layout( kts_dot_string, "svg" );
	}
	catch (e)
	{
		console.error( chalk.red(e.stack) );
		return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
				<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<text x="50" y="50" text-anchor="middle" alignment-baseline="middle" font-size="0.1em" fill="darkred">error in DOT source: ${e.message}</text>
				</svg>`;
	}
	svg = rewrite_GraphViz_SVG_to_KTS_SVG( svg, libPath );
	return svg;
}