// Mastère Big Data : Visualisation des données TP3
//
// Cécile Boukamel-Donnou / Benjamin Thery
//
//     Visualisation d'Arbre : Treemap
//
// References:
//    json to d3js: http://bl.ocks.org/d3noob/8329447
//    D3.js Layout: https://d3indepth.com/layouts/

// read json
d3.json("reingold-Tilford.json", function(error, treeData) {
  if (error) throw error;

  //get canvas context do draw in
  var canvas = document.getElementById("reingoldTilford"),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height;
  radius = 15;
  //create a tree using reingold-Tilford algorithme to affect x and y  values to nodes
  var tree = d3.tree()
  //    .size([width, height]);

  // create a heirarchy with data to have a root children
  var root = d3.hierarchy(treeData);
  //
  tree(root);

  //  flat array root and nodes
  var nodes = root.descendants();
  var links = root.links();

  //the simulation
  var simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink(links).distance(20).strength(1))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("box_force", box_force)
    .on("tick", ticked);



  d3.select(canvas)
    .call(d3.drag()
      .container(canvas)
      .subject(dragsubject)
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .selectAll("arc")
    .data("nodes")
    .enter()
    .append("arc")
    .on("mouseover", function() {
      draglistener(d3.select(this), 'onMouseOver')
    })
    .on("mouseout", function() {
      draglistener(d3.select(this), 'onMouseOut')
    });


  //ticked function called each ticks
  function ticked() {
    //undraw all
    context.clearRect(0, 0, width, height);

    //save the entire canvas state
    context.save();
    context.translate(width / 2, height / 2);

    context.beginPath();
    links.forEach(drawLink);
    context.strokeStyle = "#aaa";
    context.stroke();

    context.beginPath();
    nodes.forEach(drawNode);
    context.fill();
    context.strokeStyle = "#fff";
    context.class = "arc"
    context.stroke();

    context.restore();
    d3.select(canvas).selectAll(".arc")
      .data("nodes")
      .enter()
      .append("arc")
      .on("mouseover", onMouseOver)
      .on("mouseout", onmouseout);
    d3.selectAll(document.links).style("fill", "#fff")
      .enter()
      .append("arc")
      .on("mouseover", function() {
        draglistener(d3.select(this), 'onMouseOver')
      })
      .on("mouseout", function() {
        draglistener(d3.select(this), 'onMouseOut')
      });;
  }

  function draglistener(selection, eventtype) {
    console.log("icic " + eventtype)
    if (eventtype == 'dragstart') {
      dragstarted()
    }
    if (eventtype == 'dragged') {
      dragged()
    }
    if (eventtype == 'dragended') {
      dragended()
    } else if (eventtype == 'mouseover') {
      onMouseOver(selection)
    } else if (eventtype == 'mouseout') {
      onMouseOut()
    }
  }

  function dragsubject() {
    return simulation.find(d3.event.x - width / 2, d3.event.y - height / 2);
  }

  function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  function dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }

  function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }

  function drawLink(d) {
    context.moveTo(d.source.x, d.source.y);
    context.lineTo(d.target.x, d.target.y);
  }

  function drawNode(d) {
    context.moveTo(d.x + 3, d.y);
    context.arc(d.x, d.y, 3, 0, 2 * Math.PI);

    //d.on("mouseover", function () {console.log ("ici ")})
  }

  function onMouseOver(d) {
    console.log("ici")
    //if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.select("#tooltip")
      .style("left", (width / 2) + "px")
      .style("top", (width / 2) + "px")
      .select("#value")
      .text("toto");

  }

  function onMouseOut() {
    d3.select("#tooltip").classed("hidden", true);
  }
  //custom force to put stuff in a box
  function box_force() {
    for (var i = 0, n = nodes.length; i < n; ++i) {
      curr_node = nodes[i];
      curr_node.x = Math.max(-(width / 2), Math.min(width / 2, curr_node.x));
      curr_node.y = Math.max(-(height / 2), Math.min(height / 2, curr_node.y));
    }
  }
});
