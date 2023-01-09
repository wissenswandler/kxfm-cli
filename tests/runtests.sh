echo "graph   {a--b}" | node ../dot2svg.js > graph___a_b__by__graphviz-wasm.svg
echo "graph   {a--b}" | dot -Tsvg          > graph___a_b__by__dot.svg
echo "graph x {a--b}" | node ../dot2svg.js > graph_x_a_b__by__graphviz-wasm.svg
echo "graph x {a--b}" | dot -Tsvg          > graph_x_a_b__by__dot.svg
