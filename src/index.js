import { Stitch, AnonymousCredential, RemoteMongoClient, GoogleRedirectCredential } from 'mongodb-stitch-browser-sdk'
import $ from 'jquery'

const client = Stitch.initializeDefaultAppClient('avocado-share-vgagn');

const db = client.getServiceClient(RemoteMongoClient.factory,
   "mongodb-atlas").db('avocados');

var authed = client.auth.isLoggedIn;

if (client.auth.hasRedirectResult()){
  client.auth.handleRedirectResult().then(user => {
    console.log(user)
  })
} else if (!authed) {
  // $("#google-auth").click(() => {
    const credential = new GoogleRedirectCredential();
    Stitch.defaultAppClient.auth.loginWithRedirect(credential);
  //})
}

function newRequest() {
  var requests = db.collection('requests');
  return requests.find({"completed_id": {"$exists": false}},
                {limit: 1}).asArray().then(result => {
    if (result.length == 0) {
      return requests.insertOne({created_id: client.auth.user.id})
    } else {
      var requestToComplete = result[0];
      requestToComplete["completed_id"] = client.auth.user.id;
      return requests.updateOne({_id: requestToComplete._id}, requestToComplete)
    }
  });
}

function buildFeed() {
  var requests = db.collection('requests')
  requests.find({"completed_id": {"$exists": true},
    "created_id": {"$exists": true}})
    .asArray().then(completedRequests => {

    })
}

$(document).ready(() => {
  $(".spinner").hide();
  $("#avocado-button").click(() => {
    $("#avocado-button").hide();
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
