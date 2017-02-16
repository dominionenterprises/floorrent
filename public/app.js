"use strict";

var canvas = new fabric.Canvas('c', {selection:false});
var wrapper = document.getElementById('canvasWrapper');
var grid = 25;
var gridSize = 800;
var vertexRadius = 7;
var useGrid = true;
const ORANGE = '#ec7200';

var startLine = false;
var startVertex;
var tempLineStartX = 0, tempLineStartY = 0;
var tempLine = new fabric.Line([0, 0, 0, 0,], {
    stroke: '#ddd',
    selectable: false
});

var vertices = [];
var edges = [];

function Vertex(x, y) {
  this.circle = new fabric.Circle({
    left: x-vertexRadius,
    top: y-vertexRadius,
    radius: vertexRadius,
    stroke: ORANGE,
    strokeWidth: 1,
    fill: ORANGE,
    hasControls: false
  });
  this.edges = [];
  this.vertices = [];
  vertices.push(this);
  canvas.add(this.circle);
}

function Edge(v1, v2) {
  // get grid-snapped coordinates
  var x1 = roundToGrid(v1.circle.left + vertexRadius);
  var y1 = roundToGrid(v1.circle.top + vertexRadius);
  var x2 = roundToGrid(v2.circle.left + vertexRadius);
  var y2 = roundToGrid(v2.circle.top + vertexRadius);
  
  this.line = new fabric.Line([x1, y1, x2, y2], {
    stroke: '#aaa',
    selectable: false
  });
  this.vertices = [v1, v2];
  edges.push(this);
  v1.vertices.push(this);
  v2.vertices.push(this);
  canvas.add(this.line);
}

function roundToGrid(n) {
  return Math.round(n / grid) * grid;
}

function clearTempLine() {
  startLine = false;
  tempLine.set({x1: 0, y1: 0, x2: 0, y2: 0});
  tempLine.setCoords();
  canvas.renderAll();
}

// create grid
for (var i = 0; i <= (gridSize/grid); i++) {
  canvas.add(new fabric.Line([i*grid, 0, i*grid, gridSize], { stroke: '#eee', selectable: false}));
  canvas.add(new fabric.Line([0, i*grid, gridSize, i*grid], { stroke: '#eee', selectable: false}));
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
    if (startLine) {
      clearTempLine();
      var edge = new Edge(startVertex, vert);
    }

    // start a new line immediately
    tempLineStartX = x;
    tempLineStartY = y;
    startLine = true;
    canvas.add(tempLine);
    startVertex = vert;
  }

  return false;
});

canvas.on('mouse:move', function(options) {
  if (startLine) {
    tempLine.set({
      x1: tempLineStartX,
      y1: tempLineStartY,
      x2: options.e.offsetX,
      y2: options.e.offsetY
    });
    tempLine.setCoords();
  }
  canvas.renderAll();
});

wrapper.tabIndex = 1000;
wrapper.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    clearTempLine();
  }
  return false;
});
