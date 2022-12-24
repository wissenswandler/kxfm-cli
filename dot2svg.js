import fs from 'fs'
import chalk from 'chalk'	
import { build_diagram_from_stdin } from './build_diagram_from_stdin.js'
import { build_diagram_from_file } from './build_diagram_from_file.js'

let dotsource_filename = "graph.dot"

// set dotsource_filename from command line argument
if (process.argv.length > 2)
{
	dotsource_filename = process.argv[2]
}

// default svproduct_filename shall be the same as dotsource_filename but with .svg extension
let svgproduct_filename = dotsource_filename.replace( /\.dot$/, ".svg" )
if (process.argv.length > 3)
{
	svgproduct_filename = process.argv[3]
}

if( ! Boolean( process.stdin.isTTY ) )
{
	if( process.argv.length > 2 )
	{
		console.warn( chalk.yellowBright ( `ignoring command line argument "${process.argv[2]}" because we are piped to.` ) )
	}

	build_diagram_from_stdin()
}
else
// build diagram only if source file is newer than product file	
fs.stat( dotsource_filename, (err, source_stats) => 
{
	if (err)
	{		
		// read from stdin instead
		// open stdin for reading
		console.warn( chalk.yellowBright ( `no file with name "${dotsource_filename}",` ) )
		return build_diagram_from_stdin()
	}
	else
	fs.stat( svgproduct_filename, (err, product_stats) =>
	{
		if (err)
		{
	 		build_diagram_from_file( `initial build of missing ${svgproduct_filename} from ${dotsource_filename}`, dotsource_filename, svgproduct_filename )
		}
		else
		if (source_stats.mtime > product_stats.mtime)
		{
	 		build_diagram_from_file( `update build from ${dotsource_filename} which is newer than ${svgproduct_filename}`, dotsource_filename, svgproduct_filename )
		}
		else
		// both source and product exist and product is up to date
		{
			console.warn( chalk.grey( `no need to build ${svgproduct_filename} now but let's watch for changes and build then...` ) )
			fs.watchFile( dotsource_filename, function(curr, prev)
			{
				build_diagram_from_file( `\n${dotsource_filename} was touched,`, dotsource_filename, svgproduct_filename )
			})
		}
	})
})