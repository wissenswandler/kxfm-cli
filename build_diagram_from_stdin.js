import chalk from 'chalk';
import { build_diagram_from_string } from './build_diagram_from_string.js';

export function build_diagram_from_stdin()
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
		() => console.log( build_diagram_from_string(stdin) )
	);
}