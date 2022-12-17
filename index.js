// enhance all console output with colors
import chalk from 'chalk'	

import graphviz from 'graphviz-wasm'
await  graphviz.loadWASM()

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

import fs from 'fs'

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
	 		build_diagram_from_file( `initial build of missing ${svgproduct_filename} from ${dotsource_filename}` )
		}
		else
		if (source_stats.mtime > product_stats.mtime)
		{
	 		build_diagram_from_file( `update build from ${dotsource_filename} which is newer than ${svgproduct_filename}` )
		}
		else
		// both source and product exist and product is up to date
		{
			console.warn( chalk.grey( `no need to build ${svgproduct_filename} now but let's watch for changes and build then...` ) )
			fs.watchFile( dotsource_filename, function(curr, prev)
			{
				build_diagram_from_file( `\n${dotsource_filename} was touched,` )
			})
		}
	})
})

function build_diagram_from_stdin()
{
	console.warn( chalk.green( "reading DOT source from stdin. Type CTRL-D to signal end of your input..." ) )
	
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	// read from stdin
	let stdin = "";
	process.stdin.on('data', function(chunk) {
		stdin += chunk;
	});
	process.stdin.on('end', function() {
		const svg = build_diagram_from_string( stdin )
		return console.log( svg )
	});
}


/*
 * build diagram from DOT source file

	here is a character class, for use with regex, that will find all kinds of whitespace:
	[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]
	this helps in case of "warning: no value for width of non-ascii character"
 */
function build_diagram_from_file (log_comment)
{
	console.warn( chalk.grey( log_comment ) )

	fs.readFile( dotsource_filename, 'utf8', function (err,data)
	{
		if (err)
		{
			return console.error( chalk.red( err) )
		}

		const svg_kts = build_diagram_from_string( data )

		fs.writeFile( svgproduct_filename, svg_kts, err =>
		{
			if (err)
			{
				console.error( chalk.red( err ) )
			}
			else
			console.warn( chalk.green( svgproduct_filename + " written." ) )
		})  
	})
}

/*
 * build diagram from DOT source string
 *
 * the source string is modified to include KTS specific attributes
 * for generating navigable SVG
 */
function build_diagram_from_string( dot_string )
{
	// catch layout errors
	try
	{
		const kts_dot_string = // insert text in dot_string after the first opening brace
			dot_string.replace( /(graph.*\{)/ , '$1 node[id="\\N"] edge[id="\\T___\\H"] ' );

		const svg = graphviz.layout( kts_dot_string );
		return rewrite_GraphViz_SVG_to_KTS_SVG( svg )
	}	
	catch (e)
	{
		// inspect properties of the caught error
		// console.error( e.name );			// constant: "Error"
		   console.error( chalk.red( e.message ) );		// contains trailing newline
		// console.error( e.fileName );		// constantly "undefined"
		// console.error( e.lineNumber );	// constantly "undefined"
		// console.error( e.columnNumber );	// constantly "undefined"

		return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
				<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<text x="50" y="50" text-anchor="middle" alignment-baseline="middle" font-size="0.1em" fill="darkred">error in DOT source: ${e.message}</text>
				</svg>`
	}
}

/*
 * rewrite GraphViz SVG to include KTS CSS and Javascript,
 * and to fix GraphViz bug: reverse <title> and first <g> tags so that title will be effective in browser
 */
function rewrite_GraphViz_SVG_to_KTS_SVG( svg )
{
	const svgarray = svg.split( /\r?\n/ );

	return `${
	/*
	 * keep <xml> preamble
	 */
	svgarray[0]}\n<?xml-stylesheet type="text/css" href="https://wissenswandler.github.io/lib/graph.css"?>\n${
	/*
	 * keep next 7 lines
	 */
	svgarray.slice(1, 8).join("\n")}\n<script xlink:href="https://wissenswandler.github.io/lib/graph.js" type="text/ecmascript" />\n${
	/*
	 * fix GraphViz bug: reverse <title> and first <g> tags so that title will be effective in browser
	 */
	svgarray[9]}\n${svgarray[8]}\n${
	/*
	 * keep all the rest of SVG document
	 */
	svgarray.slice(10).join("\n")}`;
}