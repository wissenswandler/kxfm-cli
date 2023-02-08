import { Graphviz } from "@hpcc-js/wasm/graphviz";
const graphviz = await Graphviz.load();
import KTS4dot2svg from '../Tdot2svgStrings.js';
const transformer = new KTS4dot2svg( graphviz );

console.log(  transformer.build_diagram_from_string( "digraph must_fail_with_syntax_error_in_dot_source { Cause -?- Effect }" )  );