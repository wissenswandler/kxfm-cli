import chalk from 'chalk';
import { rewrite_GraphViz_SVG_to_KTS_SVG } from './rewrite_GraphViz_SVG_to_KTS_SVG.js';
import graphviz from 'graphviz-wasm'
await  graphviz.loadWASM()

/*
 * build diagram from DOT source string
 *
 * the source string is modified to include KTS specific attributes
 * for generating navigable SVG
 */
export function build_diagram_from_string(dot_string)
{

	// catch layout errors
	try {
		const kts_dot_string = // insert text in dot_string after the first opening brace
			dot_string.replace(/(graph.*\{)/, '$1 node[id="\\N"] edge[id="\\T___\\H"] ');

		const svg = graphviz.layout(kts_dot_string);
		return rewrite_GraphViz_SVG_to_KTS_SVG( svg );
	}
	catch (e)
	{
		console.error(chalk.red(e.message)); // contains trailing newline
		return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
				<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<text x="50" y="50" text-anchor="middle" alignment-baseline="middle" font-size="0.1em" fill="darkred">error in DOT source: ${e.message}</text>
				</svg>`;
	}
}