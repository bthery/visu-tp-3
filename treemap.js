// Mastère Big Data : Visualisation des données TP3
//
// Cécile Boukamel-Donnou / Benjamin Thery
//
//     Visualisation d'Arbre
//

var tmDebug = false;
var tmSvgGroup = null;

// json to d3js: http://bl.ocks.org/d3noob/8329447
// D3.js Layout: https://d3indepth.com/layouts/

// Chargement du fichier .json contenant les données
// load the external data
d3.json("treeData.json", function(error, treeData) {
    if (error) throw error;

    console.debug("Json loaded:" + treeData)

    tmRoot = d3.hierarchy(treeData, function(d) {
        return d.children;
    });
    drawTreemap(tmRoot);
});

// Fonction dessinant le treemap
function drawTreemap(root) {
    console.debug("Draw treemap")

    var svgWidth = 600;
    var svgHeight = 400;

    // Preparation de l'arbre
    var treemapLayout = d3.treemap()
        .size([svgWidth*2, svgHeight*2])
        .paddingOuter(10);

    root.sum(function(d) {
        if (d.type == "directory") {
            return d.children.length;
        } else {
            return 1;
        }
    });

    treemapLayout(root);

    // Creer le graphique
    var baseSvg = d3.select("#svgtreemap")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Creation d'un groupe qui contiendra tous les autres objets svg
    // Utilise pour implementer le zoom/pan
    tmSvgGroup = baseSvg.append("g")

    tmSvgGroup.append("rect")
        .attr("width", svgWidth*2)
        .attr("height", svgHeight*2);

    tmSvgGroup.selectAll('rect')
        .data(root.descendants())
        .enter()
        .append('rect')
            .attr("fill", "#a0d53f")
            .attr('x', function(d) { console.log(d); return d.x0; })
            .attr('y', function(d) { return d.y0; })
            .attr('width', function(d) { return d.x1 - d.x0; })
            .attr('height', function(d) { return d.y1 - d.y0; });

    // Capture les evenements pan et zoom.
    // ** Doit etre le dernier objet ajouté au svg **
    baseSvg.append("rect")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(d3.zoom()
            .scaleExtent([1 / 2, 4])
            .on("zoom", zoomed));
}

// Fonction appelee pour transformer le svg en fonction
// des evenements souris
function zoomed() {
    tmSvgGroup.attr("transform", d3.event.transform);
}
