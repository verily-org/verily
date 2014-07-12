window.twttr = (function (d, s, id) {
  var t, js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id; js.src= "https://platform.twitter.com/widgets.js";
  fjs.parentNode.insertBefore(js, fjs);
  return window.twttr || (t = { _e: [], ready: function (f) { t._e.push(f) } });
}(document, "script", "twitter-wjs"));

var tweetButton = document.getElementById('tweet-button');

var twitterCampaigner = common.campaigner('twitter');

tweetButton.dataset.url = refUrlTwitter;
tweetButton.dataset.counturl = window.location.origin + path;
tweetButton.dataset.text = title;
tweetButton.dataset.hashtags = twitterCampaigner.hashtags;

var facebookShareButton = document.getElementById('facebook-share-button');

var emailButton = document.getElementById('button-share-email');

var linkButton = document.getElementById('button-share-link');


function intent (medium, intentEvent) {

  var refUrl = refUrlLink;

  if (medium === 'twitter') {
      console.log('twitter');
      refUrl = refUrlTwitter;
  } else if (medium === 'facebook') {
      console.log('facebook');
      refUrl = refUrlFacebook;
  } else if (medium === 'email') {
      console.log('email');
      refUrl = refUrlEmail;
  } else {
    console.log('link');
  }

  $.ajax({
      type: 'POST',
      url: refUrl,
      data: {
    	  _csrf: csrf_token,
          destinationPath: path,
          medium: medium
      }
  });
}

// Wait for the asynchronous resources to load
twttr.ready(function (twttr) {
  // Now bind our custom intent events
  twttr.events.bind('click', function(intentEvent) {
      intent('twitter', intentEvent);
  });
});

facebookShareButton.addEventListener('click', function(e) {
	intent('facebook');
    FB.ui({
      method: 'share',
      href: refUrlFacebook,
    }, function(response){

    });
});

emailButton.addEventListener('click', function(e) {
    intent('email');
});

var fieldShareLink = document.getElementById('field-share-link');
var linkShareLink = document.getElementById('link-share-link');

fieldShareLink.addEventListener('click', function(e) {
    fieldShareLink.select();
});

linkShareLink.addEventListener('click', function(e) {
    // Prevent navigation to link.
    e.preventDefault();
});

linkButton.addEventListener('click', function(e) {        
    fieldShareLink.value = refUrlLink;

    linkShareLink.href = refUrlLink;
    linkShareLink.innerHTML = refUrlLink;
    intent('link');
});