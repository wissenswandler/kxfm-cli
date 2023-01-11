import chalk from 'chalk';
import KTS4dot2svg from './KTS4dot2svg.js';

export function build_diagram_from_stdin( libPath )
{
	console.warn(chalk.green("reading DOT source from stdin. Type CTRL-D to signal end of your input..."));

	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	let stdin = "";
	process.stdin.on
	(	'data',
	 	(chunk) => stdin += chunk
	);
	process.stdin.on
	(	'end',
		() => console.log( KTS4dot2svg.build_diagram_from_string( stdin, libPath ) )
	);
}