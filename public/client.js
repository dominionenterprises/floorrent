var apihost = "https://brainstorm-backend.herokuapp.com";

function closeLoginBox(){
  var loginSheet = document.getElementById("login-sheet");
  loginSheet.style.opacity = "0";
  loginSheet.style.top = "-5vh";
  var mainContainer = document.getElementById("main-container");
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
    "username": "DonutGaz",
    "password": "testpass01"
  }, function(data){
    if (data.status == 200)
      closeLoginBox();
    else
      makeLoginRed();
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
    "username": "DonutGaz3",
    "password": "testpass01"
  }, function(data){
    console.log(data);
    if (data.status == 200)
      closeLoginBox();
    else
      makeRegisterRed();
  });
}

function guestButtonClick(e){
  closeLoginBox();
}

function adminButtonClick(e){
  console.log("ADMIN");
  openAdminContainer();
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
}

document.addEventListener("DOMContentLoaded", pageRefresh);
