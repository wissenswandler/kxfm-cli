import KTS4dot2svg from "../KTS4dot2svg.js";

console.log(  KTS4dot2svg.build_diagram_from_string( "digraph must_fail_with_syntax_error_in_dot_source { Cause -?- Effect }" )  );
