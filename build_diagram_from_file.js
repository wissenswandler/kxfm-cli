import chalk from 'chalk';
import fs from 'fs';
import { build_diagram_from_string } from './build_diagram_from_string.js';

/*
 * build diagram from DOT source file

	here is a character class, for use with regex, that will find all kinds of whitespace:
	[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]
	this helps in case of "warning: no value for width of non-ascii character"
 */
export function build_diagram_from_file( log_comment, dotsource_filename, svgproduct_filename, libPath )
{
	console.warn(chalk.grey(log_comment));

	fs.readFile(dotsource_filename, 'utf8', function (err, data) {
		if (err) {
			return console.error(chalk.red(err));
		}

		const svg_kts = build_diagram_from_string( data, libPath );

		fs.writeFile( svgproduct_filename, svg_kts, err => {
			if (err) {
				console.error(chalk.red(err));
			}

			else
				console.warn(chalk.green(svgproduct_filename + " written."));
		});
	});
}
