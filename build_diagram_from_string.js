import chalk from 'chalk';
import KTS4GraphViz from './KTS4GraphViz.js';
import KTS4Dot from './KTS4Dot.js';

import graphviz from 'graphviz-wasm';
await  graphviz.loadWASM();

/*
 * build diagram from DOT source string
 *
 * the source string is modified to include KTS specific attributes
 * for generating navigable SVG
 * 
 * the resulting SVG is extended with KTS specific CSS and Javascript, to be used as a stand-alone SVG in a browser
 */
export function build_diagram_from_string( dot_string, libPath )
{
	let svg = null;
	try
	{
		svg = graphviz.layout( KTS4Dot.preprocess(dot_string), "svg" );
	}
	catch (e)
	{
		console.error( chalk.red(e.stack) );
		return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
				<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<text x="50" y="50" text-anchor="middle" alignment-baseline="middle" font-size="0.1em" fill="darkred">error in DOT source: ${e.message}</text>
				</svg>`;
	}
	svg = KTS4GraphViz.rewrite_GraphViz_SVG_to_KTS_SVG( svg, libPath );
	return svg;
}