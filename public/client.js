var apihost = "https://brainstorm-backend.herokuapp.com";
var isAdmin = false;
var currFloorplanName = "";

function closeLoginBox(){
  var loginBox = document.getElementById("login");
  loginBox.style.opacity = "0";
  loginBox.style.marginTop = "20vh";
  setTimeout(function(){
    loginBox.style.display = "none";
    openSelectionBox();
  }, 250);
}

function openSelectionBox(){
  var selectionBox = document.getElementById("selection-box");
  selectionBox.style.display = "inherit";
  setTimeout(function(){
    selectionBox.style.opacity = "1";
    selectionBox.style.marginTop = "19vh";
  }, 10);
}

function closeSelectionBox(){
  var selectionBox = document.getElementById("selection-box");
  setTimeout(function(){
    selectionBox.style.display = "none";
  }, 250);
}

function resetMainContainer(){
  var mainContainer = document.getElementById("main-container");
  var loginSheet = document.getElementById("login-sheet");
  mainContainer.style.filter = "blur(0px) saturate(1)";
  setTimeout(function(){
    loginSheet.style.display = "none";
  }, 250);
}

function openAdminContainer(){
  var selectContainer = document.getElementById("select-container");
  var adminContainer = document.getElementById("admin-container");
  selectContainer.style.opacity = "0";
  setTimeout(function(){
    selectContainer.style.display = "none";
    adminContainer.style.display = "inherit";
    setTimeout(function(){
      adminContainer.style.opacity = "1";
    }, 250);
  }, 250);
}

function makeLoginRed(){
  var username = document.getElementById("username-input");
  var password = document.getElementById("password-input");
  username.style.background = "#ff7b7b";
  password.style.background = "#ff7b7b";
}

function makeRegisterRed(){
  var username = document.getElementById("rusername-input");
  var password = document.getElementById("rpassword-input");
  var rpassword = document.getElementById("rrpassword-input");
  username.style.background = "#ff7b7b";
  password.style.background = "#ff7b7b";
  rpassword.style.background = "#ff7b7b";
}


function loginButtonClick(e){
  var usernameField = document.getElementById("username-input");
  var passwordField = document.getElementById("password-input");
  usernameField.style.background = "#FFFFFF";
  passwordField.style.background = "#FFFFFF";
  var username = usernameField.value;
  var password = passwordField.value;
  $.post(apihost + "/login", {
    username: username,
    password: password
  }, function(data){
    if (data.status == 200){
      isAdmin = true;
      closeLoginBox();
    } else {
      makeLoginRed();
    }
  });
}

function registerButtonClick(e){
  var usernameField = document.getElementById("rusername-input");
  var passwordField = document.getElementById("rpassword-input");
  var rpasswordField = document.getElementById("rrpassword-input");
  var username = usernameField.value;
  var password = passwordField.value;
  var rpassword = rpasswordField.value;
  if (rpassword != password){
    makeRegisterRed();
    return;
  }
  usernameField.style.background = "#FFFFFF";
  passwordField.style.background = "#FFFFFF";
  rpasswordField.style.background = "#FFFFFF";
  $.post(apihost + "/register", {
    username: username,
    password: password
  }, function(data){
    console.log(data);
    if (data.status == 200){
      isAdmin = true;
      closeLoginBox();
    } else {
      makeRegisterRed();
    }
  });
}

function guestButtonClick(e){
  var newButton = document.getElementById("newFloorplanPane");
  newButton.style.display = "none";
  closeLoginBox();
}

function adminButtonClick(e){
  openAdminContainer();
}

function loadAvailableFloorplans(){
  var floorplanScroll = document.getElementById("floorplan-scroll");
  $.get(apihost + "/floorplan", function(data){
    var floorplans = data;
    var floorplan, pane, border, thumb, name, creator;
    for (var i=0; i<floorplans.length; i++){
      floorplan = floorplans[i];
      pane = document.createElement("div");
      pane.setAttribute("class", "floorplan-pane");
      pane.setAttribute("data-id", floorplan.fpid);
      border = document.createElement("div");
      border.setAttribute("class", "thumb-border");
      thumb = document.createElement("img");
      thumb.setAttribute("class", "floorplan-thumb");
      thumb.setAttribute("src", floorplan.thumbnail)
      name = document.createElement("p");
      name.setAttribute("class", "floorplan-name");
      name.innerHTML = floorplan.name;
      creator = document.createElement("p");
      creator.setAttribute("class", "floorplan-creator");
      border.appendChild(thumb);
      pane.appendChild(border);
      pane.appendChild(name);
      pane.appendChild(creator);
      floorplanScroll.appendChild(pane);
      pane.addEventListener("click", handleFloorplanPaneClick);
    }
  });
  pane = document.createElement("div");
  pane.setAttribute("id", "newFloorplanPane");
  pane.setAttribute("class", "floorplan-pane");
  border = document.createElement("div");
  border.setAttribute("class", "thumb-border");
  thumb = document.createElement("div");
  thumb.setAttribute("class", "newfloorplan-thumb");
  thumb.innerHTML = "+";
  border.appendChild(thumb);
  pane.appendChild(border);
  floorplanScroll.appendChild(pane);
  pane.addEventListener("click", handleNewFloorplanPaneClick);
}

function handleFloorplanPaneClick(e){
  var currfpid = this.getAttribute("data-id");
  console.log(currfpid);
  floorplan.id = currfpid;
  load();
  closeSelectionBox();
  resetMainContainer();
}

function handleNewFloorplanPaneClick(e){
  console.log("NEW FLOORPLAN");
  setTimeout(openNameBox, 250);
}

function handleNewSubmit(e){
  var newFpName = document.getElementById("newfpname").value;
  currFloorplanName = newFpName;
  create();
  closeNameBox();
}

function openNameBox(){
  var nameBox = document.getElementById("newname-box");
  var newFpName = document.getElementById("newfpname");
  nameBox.style.display = "inherit";
  setTimeout(function(){
    nameBox.style.opacity = "1";
    newFpName.focus();
  }, 10);
}

function closeNameBox(){
  var nameBox = document.getElementById("newname-box");
  nameBox.style.opacity = "0";
  setTimeout(function(){
    nameBox.style.display = "none";
  }, 250);
}

function closeNameBox(){
  resetMainContainer();
}

function pageRefresh(){
  var loginButton = document.getElementById("login-button");
  loginButton.addEventListener("click", loginButtonClick);
  var registerButton = document.getElementById("register-button");
  registerButton.addEventListener("click", registerButtonClick);
  var guestButton = document.getElementById("guest-button");
  guestButton.addEventListener("click", guestButtonClick);
  var adminButton = document.getElementById("admin-button");
  adminButton.addEventListener("click", adminButtonClick);
  loadAvailableFloorplans();
  var newSubmitButton = document.getElementById("newsubmit");
  newSubmitButton.addEventListener("click", handleNewSubmit);
}

document.addEventListener("DOMContentLoaded", pageRefresh);
