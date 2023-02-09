import { Graphviz } from "@hpcc-js/wasm/graphviz";
import Tdot2svgStrings from '../Tdot2svgStrings.js';
const transformer = new Tdot2svgStrings(  await Graphviz.load() );

console.log(  transformer.build_diagram_from_string( "digraph must_fail_with_syntax_error_in_dot_source { Cause -?- Effect }" )  );