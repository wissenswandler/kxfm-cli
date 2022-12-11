import graphviz from 'graphviz-wasm'
await graphviz.loadWASM()

const dotsource_filename = "graph.dot"
const svgproduct_filename= "graph.svg"

import fs from 'fs'

build_diagram( "initial build from " + dotsource_filename )

fs.watchFile( dotsource_filename, function(curr, prev)
{
 build_diagram( dotsource_filename + " was touched" )
})

function build_diagram (comment) 
{
 console.log( comment )

 fs.readFile( dotsource_filename, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  const svg = graphviz.layout( data );
  
  const svgarray = svg.split( /\r?\n/ );
  let svg_kts = 
  
	/*
	 * keep <xml> preamble
	 */  
	svgarray[0] + "\n" +

	/*
	 * inject KTS stylesheet
	 */
	'<?xml-stylesheet type="text/css" href="https://wissenswandler.github.io/lib/graph.css"?>' + "\n" +
	
	/*
	 * keep next 7 lines
	 */  
	svgarray.slice(1,8).join( "\n" ) + "\n" +
	
	/*
	 * inject KTS Javascript
	 */
	'<script xlink:href="https://wissenswandler.github.io/lib/graph.js" type="text/ecmascript" />' + "\n" +

	/*
	 * fix GraphViz bug: reverse <title> and first <g> tags so that title will be effective in browser 
	 */
	svgarray[9] + "\n" + 
	svgarray[8] + "\n" + 

	/*
	 * keep all the rest of SVG document
	 */
	svgarray.slice(10).join( "\n" )
  
  fs.writeFile( svgproduct_filename, svg_kts, err => {
  if (err) {
    console.error(err);
  }
  console.log( svgproduct_filename + " written." )
  })  
})

}