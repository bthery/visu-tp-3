// Mastère Big Data : Visualisation des données TP3
//
// Cécile Boukamel-Donnou / Benjamin Thery
//
//     Visualisation d'Arbre : Treemap
//
// References:
//    json to d3js: http://bl.ocks.org/d3noob/8329447
//    D3.js Layout: https://d3indepth.com/layouts/


var tmDebug = true;
var tmWithZoomPan = false;
var tmSvgGroup = null;

var tmRoot = null;
var tmCurrentRoot = null;

const SUM_BY_SIZE     = 0;
const SUM_BY_CHILDREN = 1;

var tmSum = SUM_BY_SIZE;


// Chargement du fichier .json contenant les données
// load the external data
d3.json("treemapData.json", function(error, treeData) {
    if (error) throw error;

    console.debug("Json loaded:" + treeData)

    tmRoot = d3.hierarchy(treeData, function(d) {
        return d.children;
    });
    showCurrentPath(tmRoot);
    drawTreemap(tmRoot);
});

// Fonction dessinant le treemap
function drawTreemap(root) {
    console.debug("Draw treemap")

    // Stocke la racine courante (utilisé pour le changement de style d'affichage)
    tmCurrentRoot = root;

    var svgWidth = 800;
    var svgHeight = 500;

    var scaleFactor = 1;
    if (tmWithZoomPan) {
        scaleFactor = 2;
    }

    // Utilise la largeur maximale de l'element
    svgWidth = Math.max(document.getElementById('graph_treemap_body').offsetWidth - 40, svgWidth);

    // Calcule l'opacité des éléments en fonction de la profondeur maximum de l'arbre
    var depthOpacity = 0.2 + (0.8 / root.height);

    // Ajout d'un div pour le tooltip
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Preparation de l'arbre
    var treemapLayout = d3.treemap()
        .size([svgWidth * scaleFactor, svgHeight * scaleFactor])
        .paddingOuter(20)
        .paddingInner(4);

    // Fonction de sum() qui permet differents types d'affichage
    root.sum(function(d) {
        switch(tmSum) {
            case SUM_BY_CHILDREN:
                if (d.type == "directory") {
                    return d.children.length + d.files;
                } else {
                    return 1;
                }
                break;
            case SUM_BY_SIZE:
                return d.size > 0 ? d.size : 1;
                break;
        }
    });

    //treemapLayout.tile(d3.treemapSquarify);
    treemapLayout.tile(d3.treemapBinary);
    treemapLayout(root);

    // Creer le graphique
    var baseSvg = d3.select("#svgtreemap")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Creation d'un groupe qui contiendra tous les autres objets svg
    // Utilisé pour implementer le zoom/pan
    tmSvgGroup = baseSvg.append("g")

    nodes = tmSvgGroup.selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('transform', function(d) { return 'translate(' + [d.x0, d.y0] + ')'});

    nodes.append('rect')
        .attr('width', function(d) { return d.x1 - d.x0; })
        .attr('height', function(d) { return d.y1 - d.y0; })
        .attr("fill-opacity", depthOpacity)
        .attr("stroke-opacity", depthOpacity * 2)
        .on("mouseover", function(d, i) {
            d3.select(this)
                .attr("fill-opacity", "1.0")
                .attr("stroke-opacity", "1.0");

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.7);

            var txt = "<strong>" + d.data.name + "</strong>";
            txt += "<br/>" + "Files: " + d.data.files;
            switch(tmSum) {
                case SUM_BY_SIZE:
                    txt += "<br/>" + "Files Size: " + bytesToHumanSize(d.data.size);
                    txt += "<br/>" + "Subtree Size: " + bytesToHumanSize(d.value) + " (" + valueToPercentage(d) + "%)";
                    if (d.hasOwnProperty('children')) {
                        txt += "<br/>" + "Subdirectories: " + d.children.length;
                    }
                    break;
                case SUM_BY_CHILDREN:
                    if (d.hasOwnProperty('children')) {
                        txt += "<br/>" + "Subdirectories: " + d.children.length;
                    }
                    txt += "<br/>" + "Files in subtree: " + d.value + " (" + valueToPercentage(d) + "%)";
                    break;
            }
            tooltip.html(txt)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px")
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .attr("fill-opacity", depthOpacity)
                .attr("stroke-opacity", depthOpacity * 2)
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        })
        .on("click", function(d) {
            if (tmDebug)
                console.log(d);
            if (d == tmCurrentRoot)
                return;
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            d3.select("#svgtreemap").selectAll("*").remove();
            showCurrentPath(d);
            tmCurrentRoot = d.copy()
            drawTreemap(tmCurrentRoot);
        });

    nodes.append('text')
        .attr('dx', 4)
        .attr('dy', 14)
        .text(function(d) {
            // Affiche les noms seulement si les rectangles sont assez grands
            // A bit hackish
            const charWidth = 8;
            const charHeight = 16;
            var width = d.x1 - d.x0;
            var height = d.y1 - d.y0;
            if (width > charWidth * 2 && height > charHeight) {
                return truncateName(d.data.name, Math.floor(width / charWidth));
            } else {
                return '';
            }
        });

    // Capture les evenements pan et zoom.
    // ** Doit etre le dernier objet ajouté au svg **
    if (tmWithZoomPan) {
        baseSvg.append("rect")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(d3.zoom()
                .scaleExtent([1 / 2, 4])
                .on("zoom", zoomed));
    }
}

// Fonction appelee pour transformer le svg en fonction
// des evenements souris
function zoomed() {
    tmSvgGroup.attr("transform", d3.event.transform);
}

// Coupe les noms trop long
function truncateName(name, n) {
    return (name.length > n) ? name.substr(0, n/2) + '\u2026' + name.substr(name.length-((n/2)-1), (n/2)-1) : name;
};

// Affichage pour les humains de tailles en octets (source: Stackoverflow)
function bytesToHumanSize(bytes, decimals) {
    if (bytes == 0)
        return '0 Octet';
    var k = 1024;
    var dm = decimals <= 0 ? 0 : decimals || 2;
    var sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Retourne le pourcentage de la valeur de l'element par rapport a la valeur totale du sous-arbre
function valueToPercentage(d) {
    return parseFloat((d.value / tmCurrentRoot.value) * 100).toFixed(2);
}

// Retourne le chemin depuis la racine du sous-arbre jusqu'a l'element
function getPath(d) {
    var path = d.data.name;
    var parent = d.parent;
    while (parent) {
        if (parent.parent) {
            // Root is already in path
            path = parent.data.name + "/" + path;
        }
        parent = parent.parent;
    }
    return path;
}

// Affiche sur la page le chemin vers l'element courant
function showCurrentPath(d) {
    if (d == tmRoot)
        $('#path_label').text(getPath(d));
    else
        $('#path_label').text($('#path_label').text() + "/" + getPath(d));
}

//
// Appelés quand les boutons de style sont cliqués
//
$('#subtree_size_button').click(function() {
    $(this).siblings().removeClass('active');
    console.log("Subtree Size!");
    if (tmSum != SUM_BY_SIZE) {
        tmSum = SUM_BY_SIZE;
        d3.select("#svgtreemap").selectAll("*").remove();
        drawTreemap(tmCurrentRoot);
    }
});

$('#children_count_button').click(function() {
    $(this).siblings().removeClass('active');
    console.log("Children count!");
    if (tmSum != SUM_BY_CHILDREN) {
        tmSum = SUM_BY_CHILDREN;
        d3.select("#svgtreemap").selectAll("*").remove();
        drawTreemap(tmCurrentRoot);
    }
});

// Retour a la racine de l'arbre
$('#root_button').click(function() {
    if (tmCurrentRoot == tmRoot)
        return;
    d3.select("#svgtreemap").selectAll("*").remove();
    showCurrentPath(tmRoot);
    drawTreemap(tmRoot);
});

$('.nav-tabs a').on('shown.bs.tab', function(event) {
    if ($(event.target).text() == "Treemap") {
        d3.select("#svgtreemap").selectAll("*").remove();
        showCurrentPath(tmRoot);
        drawTreemap(tmRoot);
    }
});
