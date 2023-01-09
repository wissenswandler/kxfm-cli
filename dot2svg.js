import fs from 'fs'
import chalk from 'chalk'	
import { build_diagram_from_stdin } from './build_diagram_from_stdin.js'
import { build_diagram_from_file } from './build_diagram_from_file.js'
import { exit } from 'process';


let dotsource_filename;
let svgproduct_filename;

let force_build = false;
if( process.argv.includes( "-f" ) )
{
	force_build = true;
	// remove "-f" from process.argv
	process.argv.splice( process.argv.indexOf( "-f" ), 1 );
}
let watch = false;
if( process.argv.includes( "-w" ) )
{
	watch = true;
	// remove "-w" from process.argv
	process.argv.splice( process.argv.indexOf( "-w" ), 1 );
}

/*
 * set dotsource_filename from command line argument or use default "graph.dot"
 */
function set_dotsource_filename ()
{
	if (process.argv.length > 2)
	{
		dotsource_filename = process.argv[2]
	}
	else
	{
		dotsource_filename = "graph.dot";
		console.warn( chalk.grey( `assuming DOT input from ${dotsource_filename} (supply filename as 1. parameter if needed)` ) )
	}
}

function set_svgproduct_filename ()
{
	if (process.argv.length > 3)
	{
		svgproduct_filename = process.argv[3]
	}
	else
	{
		// default svproduct_filename shall be the same as dotsource_filename but with .svg extension
		svgproduct_filename = dotsource_filename.replace( /\.dot$/, ".svg" );
		console.warn( chalk.grey( `assuming SVG output  to ${svgproduct_filename} (supply filename as 2. parameter if needed)` ) )
	}
}

/*
 *
 * CLI
 * 
 */

if( ! Boolean( process.stdin.isTTY ) && process.argv.length === 2 )
// (apparently) piped input AND no command line argument
{
	if( process.argv.length > 2 )
	{
		console.warn( chalk.yellowBright ( `ignoring command line argument "${process.argv[2]}" because we are piped to.` ) )
	}

	build_diagram_from_stdin();
}
else
{
// no piped input OR command line argument

if( ! Boolean( process.stdin.isTTY ) && process.argv.length > 2 )
// piped input AND command line argument => over defined !!
{
	console.warn( chalk.yellowBright ( `ignoring piped input in favour of command-line parameter "${process.argv[2]}"` ) )
}
// no piped input AND no command line argument

set_dotsource_filename();

// build diagram only if source file is newer than product file	
fs.stat( dotsource_filename, (err, source_stats) => 
{
	if (err)
	{		
		console.error( chalk.red ( `no file with name "${dotsource_filename}" => aborting` ) )
		exit( 404 );
	}
	else
	set_svgproduct_filename();
	fs.stat( svgproduct_filename, (err, product_stats) =>
	{
		if (err)
		{
	 		build_diagram_from_file( `initial build of missing ${svgproduct_filename} from ${dotsource_filename}`, dotsource_filename, svgproduct_filename )
			if( watch )	watch_sourcefile_to_build_productfile( dotsource_filename, svgproduct_filename );
		}
		else
		if (source_stats.mtime > product_stats.mtime)
		{
	 		build_diagram_from_file( `update build from ${dotsource_filename} which is newer than ${svgproduct_filename}`, dotsource_filename, svgproduct_filename )
			if( watch )	watch_sourcefile_to_build_productfile( dotsource_filename, svgproduct_filename );
		}
		else
		// both source and product exist and product is up to date
		if( force_build )
		{
	 		build_diagram_from_file( `forcing build from ${dotsource_filename} which is older than ${svgproduct_filename}`, dotsource_filename, svgproduct_filename )
			if( watch )	watch_sourcefile_to_build_productfile( dotsource_filename, svgproduct_filename );
		}
		else
		{
			console.warn( chalk.grey( `no need to build ${svgproduct_filename} now but let's watch for changes and build then (force build with parameter "-f")` ) )
			watch_sourcefile_to_build_productfile( dotsource_filename, svgproduct_filename );
		}
	})
})
}

function watch_sourcefile_to_build_productfile( dotsource_filename, svgproduct_filename )
{
	console.warn( chalk.grey( `watching ${dotsource_filename} for changes...` ) )
	fs.watchFile
	(	dotsource_filename,
		() =>
		{
			build_diagram_from_file(`\n${dotsource_filename} was touched,`, dotsource_filename, svgproduct_filename);
		}
	)
}