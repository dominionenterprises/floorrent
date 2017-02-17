"use strict";

// user
var user = {
  id: 2,
  name: 'Please log in.'
};

// floorplan
var floorplan = {
  id: null,
  name: null,
  created: false
};

var apihost = "https://brainstorm-backend.herokuapp.com";

// create fabric canvas
var canvas = new fabric.Canvas('c', {
  selection: false,
  preserveObjectStacking: true
});
var nameDiv = $('#name');

// global containers
var vertices = [];
var edges = [];
var gridLines = [];

var wrapper = document.getElementById('canvasWrapper');

// grid variables
var grid = 25;
var gridSize = canvas.width;
var vertexRadius = 10;
var useGrid = true;
var ORANGE = '#ec7200';

// edge and vertex id's (incremented)
var edgeId = 0, vertexId = 0;

// temp line globals
var showTempLine = false;
var tempLineStartVertex;
var tempLine = new fabric.Line([0, 0, 0, 0,], {
  stroke: '#ddd',
  strokeWidth: 3,
  selectable: false
});

window.addEventListener('resize', resizeCanvas, false);
function resizeCanvas() {
  canvas.setWidth(wrapper.offsetWidth);
  canvas.setHeight(wrapper.offsetHeight);
  canvas.renderAll();
  gridSize = wrapper.offsetWidth > wrapper.offsetHeight ? wrapper.offsetWidth : wrapper.offsetHeight;
  updateGrid(grid);
}
resizeCanvas();



// SERIALIZING VIEWS AND MODELS
function View2Model() {
  return edges.map(function(e) {
    return {
      x1: e.x1,
      x2: e.x2,
      y1: e.y1,
      y2: e.y2
    }
  });
}

function Model2View(model) {
  if (!model)
    return;
  var vs = []
  var es = []
  var seenVertices = {};
  for (var i = 0; i < model.length; i++) {
    var e = model[i];
    var v1 = new Vertex(e.x1, e.y1);
    var v2 = new Vertex(e.x2, e.y2);
    var edge = new Edge(v1, v2);
    edge.vertices = [];
    es.push(edge);
    var v1Hash = [e.x1, e.y1].join(',');
    if (!(v1Hash in seenVertices)) {
      vs.push(v1);
      seenVertices[v1Hash] = v1;
      v1.edges = [edge];
    }
    seenVertices[v1Hash].edges.push(edge);
    edge.vertices.push(seenVertices[v1Hash]);
    var v2Hash = [e.x2, e.y2].join(',');
    if (!(v2Hash in seenVertices)) {
      vs.push(v2);
      seenVertices[v2Hash] = v2;
      v1.edges = [edge];
    }
    seenVertices[v2Hash].edges.push(edge);
    edge.vertices.push(seenVertices[v2Hash]);
  }
  return {
    vertices: vs,
    edges: es
  };
}

// debugger
function serializeAndRender() {
  var model = View2Model();
  var view = Model2View(model);
  var vs = view.vertices;
  var es = view.edges;
  vs.forEach(function(v) {
    vertices.push(v);
    canvas.add(v);
  });
  es.forEach(function(e) {
    edges.push(e);
    canvas.add(e);
  });
}

function renderView(view) {
  var vs = view.vertices;
  var es = view.edges;
  vs.forEach(function(v) {
    vertices.push(v);
    canvas.add(v);
  });
  es.forEach(function(e) {
    edges.push(e);
    canvas.add(e);
  });
}

Math.dist=function(x1,y1,x2,y2){
  if(!x2) x2=0;
  if(!y2) y2=0;
  return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}



// VERTEX, EDGE CLASSES
function createVertex(x, y) {
  scheduleSave();
  var vert = new Vertex(x, y);
  vertices.push(vert);
  canvas.add(vert);
  return vert;
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
    type: 'vertex',
    opacity: 0,
    selectable: false
  });

  return circle;
}

function createEdge(v1, v2) {
  scheduleSave();
  var edge = new Edge(v1, v2);
  edges.push(edge);
  edge.vertices[0].edges.push(edge);
  edge.vertices[1].edges.push(edge);
  canvas.add(edge);
  return edge
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

  return line;
}



// TEMP LINE (for placing walls)
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



// GRID STUFF
function roundToGrid(n) {
  return Math.round(n / grid) * grid;
}

function drawGrid() {
  for (var i = 0; i <= (gridSize/grid); i++) {
    var column = new fabric.Line([i*grid, 0, i*grid, gridSize], { stroke: '#eee', selectable: false});
    canvas.add(column);
    gridLines.push(column);
    canvas.sendToBack(column);

    var row = new fabric.Line([0, i*grid, gridSize, i*grid], { stroke: '#eee', selectable: false});
    canvas.add(row);
    gridLines.push(row);
    canvas.sendToBack(row);
  }
}

function clearGrid() {
  for (var i = 0; i < gridLines.length; i++) {
    gridLines[i].remove();
  }
  gridLines = [];
  canvas.renderAll();
}

function updateGrid(n) {
  clearGrid();
  grid = n;
  drawGrid();
}

// add some lines
canvas.add(new fabric.Line([], {
  stroke: '#aaa',
  selectable: true
}));

// create new lines
canvas.on('mouse:down', function(options) {
  if (!lineDrawingMode)
    return;
  // complete a line or start a new one
  if (!options.target || !options.target.selectable) {
    var x = roundToGrid(options.e.offsetX);
    var y = roundToGrid(options.e.offsetY);

    var vert = createVertex(x, y);
    if (showTempLine) {
      clearTempLine();
      createEdge(tempLineStartVertex, vert);
    }
    canvas.setActiveObject(vert);
  }
});

canvas.on('object:selected', function(options) {
  if (options.target.type === 'vertex') {
    if (showTempLine) {
      var vert = options.target;
      var edge = createEdge(tempLineStartVertex, vert);
      clearTempLine();
      canvas.setActiveObject(vert);
    } else {
      // start temp line from target
      startTempLine(options.target);
    }
  }
});

function other(vert, edge) {
  return edge.vertices[0] === vert ? edge.vertices[1] : edge.vertices[0];
}

canvas.on('object:moving', function(options) {
  var obj = options.target;
  if (obj.type === 'vertex' || obj.type === 'icon') {
    scheduleSave();
  }

  if (obj.type === 'vertex') {
    var vert = options.target;

    // snap to grid
    vert.set({
      left: roundToGrid(vert.left) - vertexRadius,
      top: roundToGrid(vert.top) - vertexRadius
    });

    // reset lines connected to it
    for (var i = 0; i < vert.edges.length; i++) {
      var edge = vert.edges[i];

      // redraw those lines
      var otherVert = other(vert, edge);
      edge.set({
        x1: vert.left + vertexRadius,
        y1: vert.top + vertexRadius,
        x2: otherVert.left + vertexRadius,
        y2: otherVert.top + vertexRadius
      });
      edge.setCoords();
    }

    canvas.renderAll();
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
      canvas.bringToFront(vert);
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
  } else if (e.key == 'Backspace') {
    var obj = canvas.getActiveObject();
    scheduleSave();
    if (obj.type === 'label') {
      delete labels[obj.id];
    } else if (obj.type === 'icon') {
      delete icons[obj.id];
    } else if (obj.type === 'vertex') {
      vertices = vertices.filter(function(el) {
        return el.id !== obj.id;
      });
      for (var i = 0; i < obj.edges.length; i++) {
        var edge = obj.edges[i];
        edges = edges.filter(function(el) {
          return el.id !== edge.id;
        });

        // remove from each vertex edge list
        for (var j = 0; j < vertices.length; j++) {
          var vert = vertices[j];
          vert.edges = vert.edges.filter(function(el) {
            return el.id !== edge.id;
          });
        }

        canvas.remove(edge);
      }
      // clear selection
      clearTempLine();
      canvas.deactivateAll();
    }
    canvas.remove(obj);
  }
  return false;
});

function attachClickHandlers() {
  var imgs = document.getElementsByClassName('icon-image');
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    img.onclick = addIcon.bind(this, img.src, $(img).hasClass('fixture'));
  }
  var placeTextButton = document.getElementById('placeTextButton');
  placeTextButton.onclick = addLabel;
}

attachClickHandlers();

var labelId = 0;
var labels = {};

function addLabel(e, text, opts) {
  text = text || 'room';
  opts = opts || {};
  var text = new fabric.IText(text, Object.assign({
    fontSize: 20,
    fontFamily: 'Trebuchet MS'
  }, opts));
  var id = labelId++;
  labels[id] = text;
  text.id = id;
  text.type = 'label';
  canvas.add(text);
}

function Labels2Model() {
  var data = [];
  for (var key in labels) {
    var label = labels[key];
    data.push({
      text: label.text,
      top: label.getTop(),
      left: label.getLeft()
    });
  }
  return data;
}

function Model2Labels(model) {
  model.forEach(function(label) {
    addLabel(null, label.text, {
      top: label.top,
      left: label.left
    });
  });
}

var iconId = 0;

var icons = {};

function addIcon(url, isFixture) {
  fabric.loadSVGFromURL(url, function(objects, options) {
    var obj = fabric.util.groupSVGElements(objects, options);
    var id = iconId++;
    obj.id = id;
    obj.isFixture = isFixture;
    obj.url = url;
    icons[id] = obj;
    if (!isAdmin && isFixture) {
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.lockScalingX = true;
      obj.lockScalingY = true;
      obj.lockUniScaling = true;
      obj.lockRotation = true;
    }
    canvas.add(obj).renderAll();
  });
}

function Icons2Model() {
  var data = [];
  for (var key in icons) {
    var icon = icons[key];
    data.push({
      url: icon.url,
      angle: icon.getAngle(),
      top: icon.top,
      left: icon.left,
      scaleX: icon.scaleX,
      scaleY: icon.scaleY
    });
  }
  return data;
}

function Model2Icons(model) {
  loadIcon(model, 0);
}

function loadIcon(model, i) {
  if (i >= model.length)
    return;
  var icon = model[i];
  fabric.loadSVGFromURL(icon.url, function(objects, options) {
    var obj = fabric.util.groupSVGElements(objects, options);
    obj.set({
      angle: icon.angle,
      top: icon.top,
      left: icon.left,
      scaleX: icon.scaleX,
      scaleY: icon.scaleY
    });
    var id = iconId++;
    obj.id = id;
    obj.url = icon.url;
    obj.type = 'icon';
    icons[id] = obj;
    canvas.add(obj).renderAll();
    loadIcon(model, ++i);
  });
}

// API CALLS HERE WOOOOOOOO
function create() {
  var model = View2Model();
  var name = currFloorplanName;
  var tempcanvas = document.getElementById("c");
  var thumbnail = tempcanvas.toDataURL("image/png");

  $.ajax({
    url: apihost + '/floorplan',
    type: 'POST',
    data: {
      creator: user.id,
      name: name,
      content: model,
      thumbnail: thumbnail
    },
    success: createCallback
  });
}
function createCallback(data) {
  floorplan.id = data.fpid;
  floorplan.created = true;
}

function load() {
  $.ajax({
    url: apihost + '/floorplan/' + floorplan.id,
    type: 'GET',
    success: loadCallback
  });
}
function loadCallback(data) {
  var model = JSON.parse(data.content);
  var icons = JSON.parse(data.icons);
  var labels = JSON.parse(data.labels);
  floorplan.id = data.fpid;
  floorplan.created = true;
  floorplan.name = data.name;
  nameDiv.text('Floor plan: ' + floorplan.name);

  var view = Model2View(model);
  renderView(view);
  view = Model2Icons(icons);
  renderView(view);
  view = Model2Labels(labels);
  renderView(view);

}

function save() {
  var model = View2Model();
  var iconsModel = Icons2Model();
  var labelsModel = Labels2Model();
  var tempcanvas = document.getElementById("c");
  var thumbnail = tempcanvas.toDataURL("image/png");

  socket.emit('save', {
    id: floorplan.id,
    name: currFloorplanName,
    content: model,
    thumbnail: thumbnail,
    labels: labelsModel,
    icons: iconsModel
  });
  //$.ajax({
  //  url: apihost + '/floorplan/' + floorplan.id,
  //  type: 'POST',
  //  data: {
  //    id: floorplan.id,
  //    name: name,
  //    content: model,
  //    thumbnail: "..."
  //  },
  //  success: saveCallback
  //});
}
//function saveCallback(data) {
//  console.log("great! saved");
//}



// AUTOSAVING, SOCKETS
var socket = io();
var saveDiv = $('#save');

function scheduleSave() {
  if (isAdmin) {
    saveInterval = MAX_SAVE_INTERVAL;
    saveDiv.text('Saving changes...');
  }
}

var saveInterval = 0;
var MAX_SAVE_INTERVAL = 3;
function checkForSave() {
  if (isAdmin) {
    if (saveInterval == 1) {
      console.log('saving');
      if (floorplan.created) save();
      saveDiv.text('All changes saved.');
    }

    if (saveInterval > 0) saveInterval--;
  }
}
setInterval(checkForSave, 1000);

socket.on('update', function(data) {
  console.log('got update');
  console.log(data.content);
  if (data.fpid === floorplan.id) {
    var model = JSON.parse(data.content);
    var view = Model2View(model);
    // clear and render
    for (var i = 0; i < vertices.length; i++) canvas.remove(vertices[i]);
    for (var i = 0; i < edges.length; i++) canvas.remove(edges[i]);
    vertices = [];
    edges = [];
    renderView(view);
  } 
});



// SLIDER
$(function() {
  var handle = $( "#custom-handle" );
  $("#slider").slider({
    value:1,
    min: 0,
    max: 2,
    step: 1,
    slide: function(event, ui) {
      $("#amount").val("$" + ui.value);
    },
    change: function(e, ui) {
      switch (ui.value) {
        case 0:
          updateGrid(40);
          break;
        case 1:
          updateGrid(25);
          break;
        case 2:
          updateGrid(10);
          break;
      }
    }
  });
  $("#amount").val("$" + $("#slider").slider("value"));
});

var lineDrawingMode = true;

$("#placeLineButton").toggleClass('depressed');

$("#placeLineButton").click(function() {
  $(this).toggleClass('depressed');
  lineDrawingMode = !lineDrawingMode;
});

