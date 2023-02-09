import { Graphviz } from "@hpcc-js/wasm/graphviz";
import Tdot2svgStrings from '../Tdot2svgStrings.js';
const transformer = new Tdot2svgStrings(  await Graphviz.load() );

console.log(  transformer.build_diagram_from_string( "digraph Pattern { Cause -> Effect }" )  );