"use strict";

var canvas = new fabric.Canvas('c', {
  selection: false,
  preserveObjectStacking: true
});

var vertices = [];
var edges = [];

var wrapper = document.getElementById('canvasWrapper');
var grid = 25;
var gridSize = 800;
var vertexRadius = 10;
var useGrid = true;
var ORANGE = '#ec7200';

var edgeId = 0, vertexId = 0;
var selected;

var showTempLine = false;
var tempLineStartVertex;
var tempLine = new fabric.Line([0, 0, 0, 0,], {
  stroke: '#ddd',
  strokeWidth: 3,
  selectable: false
});

Math.dist=function(x1,y1,x2,y2){ 
  if(!x2) x2=0; 
  if(!y2) y2=0;
  return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)); 
}

function Vertex(x, y) {
  var circle = new fabric.Circle({
    left: x-vertexRadius,
    top: y-vertexRadius,
    radius: vertexRadius,
    stroke: ORANGE,
    strokeWidth: 1,
    fill: ORANGE,
    hasControls: false,
    id: vertexId++,
    edges: [],
    type: 'Vertex',
    opacity: 0,
    selectable: false
  });

  vertices.push(circle);
  canvas.add(circle);
  return circle;
}

function Edge(v1, v2) {
  // get grid-snapped coordinates
  var x1 = roundToGrid(v1.left + vertexRadius);
  var y1 = roundToGrid(v1.top + vertexRadius);
  var x2 = roundToGrid(v2.left + vertexRadius);
  var y2 = roundToGrid(v2.top + vertexRadius);
  
  var line = new fabric.Line([x1, y1, x2, y2], {
    stroke: '#aaa',
    strokeWidth: 3,
    selectable: false,
    id: edgeId++,
    vertices: [v1, v2],
    type: 'Edge'
  });

  edges.push(line);
  v1.edges.push(line);
  v2.edges.push(line);
  canvas.add(line);

  return line;
}

function roundToGrid(n) {
  return Math.round(n / grid) * grid;
}

// start temp line from vertex
function startTempLine(vert) {
  tempLineStartVertex = vert;
  showTempLine = true;
  canvas.add(tempLine);
}

function clearTempLine() {
  showTempLine = false;
  tempLine.set({x1: 0, y1: 0, x2: 0, y2: 0});
  tempLine.setCoords();
  canvas.renderAll();
}

// create grid
for (var i = 0; i <= (gridSize/grid); i++) {
  var column = new fabric.Line([i*grid, 0, i*grid, gridSize], { stroke: '#eee', selectable: false});
  canvas.add(column);

  var row = new fabric.Line([0, i*grid, gridSize, i*grid], { stroke: '#eee', selectable: false});
  canvas.add(row);
}

// add some lines
canvas.add(new fabric.Line([], {
  stroke: '#aaa',
  selectable: true
}));

// create new lines
canvas.on('mouse:down', function(options) {
  // complete a line or start a new one
  if (!options.target || !options.target.selectable) {
    var x = roundToGrid(options.e.offsetX);
    var y = roundToGrid(options.e.offsetY);
    console.log(options);
    console.log('creating vertex at ' + x + ', ' + y);

    var vert = new Vertex(x, y);
    if (showTempLine) {
      clearTempLine();
      var edge = new Edge(tempLineStartVertex, vert);
    }
    canvas.setActiveObject(vert);
  }
});

canvas.on('object:selected', function(options) {
  if (options.target.type === 'Vertex') {
    if (showTempLine) {
      var vert = options.target;
      var edge = new Edge(tempLineStartVertex, vert);
      clearTempLine();
      canvas.setActiveObject(vert);
    } else {
      // start temp line from target
      startTempLine(options.target);
    }
  }

});

//function other(vert, edge) {
//  if (edge.v1) 
//}

canvas.on('object:moving', function(options) {
  if (options.target.type === 'Vertex') {
    var vert = options.target;

    // reset lines connected to it
    for (var i = 0; i < vert.edges.length; i++) {
      var edge = vert.edges[i];
      // redraw those lines
    }
  }
});

canvas.on('mouse:move', function(options) {
  if (showTempLine) {
    tempLine.set({
      x1: tempLineStartVertex.left + vertexRadius,
      y1: tempLineStartVertex.top + vertexRadius,
      x2: options.e.offsetX,
      y2: options.e.offsetY
    });
    tempLine.setCoords();
  }

  // check for vertices to color
  for (var i = 0; i < vertices.length; i++) {
    var vert = vertices[i];
    if (Math.dist(vert.left, vert.top, options.e.offsetX, options.e.offsetY) < 50
        || canvas.getActiveObject() === vert) {
      vert.set({
        opacity: 1,
        selectable: true
      });
    } else {
      vert.set({
        opacity: 0,
        selectable: false
      });
    }
  }

  canvas.renderAll();
});

wrapper.tabIndex = 1000;
wrapper.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    clearTempLine();
    canvas.deactivateAll();
  }
  return false;
});

