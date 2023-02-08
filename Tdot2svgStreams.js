/*
 * lightweight KTS lib for node.js
 *
 * depends on streams, so using chalk is OK
 * will not work in Forge FaaS or Browser
 */

import chalk from 'chalk';
import KTS4dot2svg from './Tdot2svgStrings.js';


export default class Tdot2svgStreams
{

static build_diagram_from_stdin( libPath, graphviz )
{
	console.warn(chalk.green("reading DOT source from stdin. Type CTRL-D to signal end of your input..."));

	let transformer = new KTS4dot2svg( graphviz );

	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	let stream_input = "";
	process.stdin.on
	(	'data',
	 	(chunk) => stream_input += chunk
	);
	process.stdin.on
	(	'end',
		() => console.log( transformer.build_diagram_from_string( stream_input, libPath ) )
	);
}

} // end class Tdot2svgStreams