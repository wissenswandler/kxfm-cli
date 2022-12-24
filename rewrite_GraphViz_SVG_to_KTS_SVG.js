/*
 * rewrite GraphViz SVG to include KTS CSS and Javascript,
 * and to fix GraphViz bug: reverse <title> and first <g> tags so that title will be effective in browser
 */
export function rewrite_GraphViz_SVG_to_KTS_SVG(svg) {
	const svgarray = svg.split(/\r?\n/);

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