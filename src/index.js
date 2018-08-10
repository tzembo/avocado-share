import { Stitch, AnonymousCredential, RemoteMongoClient, GoogleRedirectCredential } from 'mongodb-stitch-browser-sdk'
import $ from 'jquery'

const client = Stitch.initializeDefaultAppClient('avocado-share-vgagn');

const db = client.getServiceClient(RemoteMongoClient.factory,
   "mongodb-atlas").db('avocados');

var authed = client.auth.isLoggedIn;
var location = "main";

if (client.auth.hasRedirectResult()){
  client.auth.handleRedirectResult().then(user => {
    console.log(user)
  })
} else if (!authed) {
    const credential = new GoogleRedirectCredential();
    Stitch.defaultAppClient.auth.loginWithRedirect(credential);
}

function newRequest() {
  console.log(client.auth.user)
  var requests = db.collection("requests");
  return requests.find({"completed_id": {"$exists": false}}, {limit: 1}).asArray().then((res) => {
    if (res.length === 0) {
      return requests.insertOne({created_id: client.auth.user.id, created_name: client.auth.user.profile.data.name}).then(showPendingRequest);
    } else {
      var requestToComplete = res[0]
      requestToComplete.completed_id = client.auth.user.id;
      requestToComplete.completed_time = new Date()
      requestToComplete.completed_name = client.auth.user.profile.data.name
      return requests.updateOne({_id: requestToComplete._id}, requestToComplete).then(() => showCompletedRequest(requestToComplete));
    }
  });
}

function showPendingRequest() {
  var html = "<p><h1 class=\"match\">Hold tight.</h1></p><p>We'll let you know when someone else wants to split an avocado!</p>";
  document.getElementById("result").innerHTML = html;
}

function showCompletedRequest(request) {
  var html = "<p><h1 class=\"match\">It's a match!</h1></p><p><span class=\"green\">" + request.created_name + "</span> wants to split an avocado with you. Meet them in the <span class=\"green\">Phase 3 Kitchen</span>.</p>";
  document.getElementById("result").innerHTML = html;
}

function getFeed() {
  var requests = db.collection('requests')
  requests.find({"completed_id": {"$exists": true},
    "created_id": {"$exists": true}}, {sort: {"_id": -1}})
    .asArray().then(showFeed);
}

function showFeed(docs) {
  var html = docs.map(d => "<p class=\"feed-item\"><span class=\"green\">" + d.created_name + "</span> shared an 🥑 with <span class=\"green\">" + d.completed_name + "</span> " + getMinutesElapsed(d.completed_time) + "m ago.</p>").join("");
  document.getElementById("feed").innerHTML = html;
}

function getMinutesElapsed(time) {
  var now = new Date()
  var diffMins = Math.round((((now - time) % 86400000) % 3600000) / 60000);
  return diffMins
}

$(document).ready(() => {
  getFeed();
  $(".spinner").hide();
  $(".loc-option").click((e) => {
    location = e.target.getAttribute("data-loc");
    document.getElementsByClassName("dropbtn")[0].innerHTML = "Location: " + location;
  });
  $("#avocado-button").click(() => {
    document.getElementById("avocado-button").disabled = true;
    $(".spinner").show();
    newRequest().then(() => {
      $(".spinner").hide();

    })
  })
  if (authed) {
    $(".logout").click(() => {
      client.auth.logout().then(() => location.reload());
    });
  }
})
