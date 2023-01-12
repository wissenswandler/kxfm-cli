/*
 * lightweight KTS lib (no dependencies)
 */

export default class KTS4Dot
{
	/*
	 * add some required and some recommended attributes to the DOT string
	 *
	 * also scan for image urls and return them in an array
	 */
	static preprocess(dot_string)
	{
		return dot_string.replace
		(
			/(graph.*\{)/
			,
			`$1
graph [
    color=whitesmoke
    fontname=Helvetica
    labelloc=b
    rankdir=BT
    remincross=true
    splines=true
    style="filled,rounded"
    target=details
    tooltip=" "
]
node [ id="\\N"
    fillcolor=white
    fontname=Helvetica
    height=0
    shape=box
    style="filled,rounded"
    target=details
    tooltip=" "
    width=0
]
edge [ id="\\T___\\H"
    arrowtail=none
    color=forestgreen
    dir=both
    fontsize=10
    penwidth=2
    target=details
    tooltip=" "
	 labeltooltip=" "
	  headtooltip=" "     
	  tailtooltip=" "
]`		);
	};
}
