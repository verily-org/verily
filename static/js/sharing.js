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
tweetButton.dataset.text = postTitle;
tweetButton.dataset.hashtags = [twitterCampaigner.hashtags, 'NepalEarthquake', 'PrayforNepal'];

var facebookShareButton = document.getElementById('facebook-share-button');

var emailButton = document.getElementById('button-share-email');

var linkButton = document.getElementById('button-share-link');

function getRefCode(medium) {
    var refCode = refCodeLink;
    
    if (medium === 'twitter') {
        refCode = refCodeTwitter;
        
    } else if (medium === 'facebook') {
        refCode = refCodeFacebook;
        
    } else if (medium === 'email') {
        refCode = refCodeEmail;
        
    }
    
    return refCode;
}

function getRefUrl(medium) {
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
    
    return refUrl;
}


function intent (medium, intentEvent) {
  var refUrl = getRefUrl(medium);

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

function socialEvent(medium, type, event) {
    var refCode = getRefCode(medium);
    
    $.ajax({
        type: 'POST',
        url: '/social-event',
        data: {
            _csrf: csrf_token,
            refCode: refCode,
            path: path,
            medium: medium,
            type: type,
            rawEvent: event
        }
    });
}

// Wait for the asynchronous resources to load
twttr.ready(function (twttr) {
  // Now bind our custom intent events
  twttr.events.bind('click', function(intentEvent) {
      intent('twitter', intentEvent);
  });
  
  try {
      twttr.events.bind('tweet', function (event) {
        // Triggered when the user publishes a Tweet (either new, or a reply) through the Tweet Web Intent.
        // Reference: https://dev.twitter.com/docs/tfw/events
        socialEvent('twitter', 'tweet', event);
      });
  
    } catch (e) {
        console.log("couldn't handle tweet event");
    }
  
});


facebookShareButton.addEventListener('click', function(e) {
	intent('facebook');
    FB.ui({
      method: 'feed',
      link: refUrlFacebook,
      name: postTitle,
      picture: imageUrl,
      description: description
    }, function(response){
        // A Open Graph story published on Facebook.
        // Reference: https://developers.facebook.com/docs/sharing/reference/share-dialog
        
        try {
            socialEvent('facebook', 'post', response);
        
        } catch (e) {
            console.log("couldn't handle facebook post event");
        }
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