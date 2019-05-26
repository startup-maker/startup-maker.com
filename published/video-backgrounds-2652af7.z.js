/* globals lp */
;(function(){
  var muteAndLoopYoutubeVideos = function() {
    var $youtubeVideos = lp.jQuery('.lp-pom-video-background-iframe-youtube');
    if ($youtubeVideos.length === 0) {
      return;
    }

    var onVideoReady = function(ev) {
      // We remove the playlist (which disables the player's default looping
      // functionality) so we can control the loop ourselves below.
      ev.target.mute().loadPlaylist(null);
    };

    var replayVideo = function(player) {
      // If the video iframe is still in the DOM, trigger a replay. We seek to 0.2 secs
      // instead of 0 because this avoids a black flicker in Safari.
      if (lp.jQuery(player.getIframe()).parent().length) {
        player.seekTo(0.2).playVideo();
      }
    };

    var setVideoReplayTimeout = function(player, replayTimeout) {
      var timeRemaining = player.getDuration() - player.getCurrentTime() - 0.2;
      if (timeRemaining > 0) {
        window.clearTimeout(replayTimeout);
        replayTimeout = window.setTimeout(function() {
          replayVideo(player);
        }, timeRemaining * 1000);
      }
    };

    var onVideoStateChange = function(replayTimeout, $video) {
      return function(ev) {
        // Possible states (ev.data):
        //   -1: unstarted
        //    0: ended
        //    1: playing
        //    2: paused
        //    3: buffering
        //    5: video cued

        if (ev.data === 1) {
          // When the video starts playing, set a timeout to replay the video as soon as
          // playback has finished. This provides a more seamless loop than YouTube's
          // built-in looping functionality.
          $video.css('visibility', 'visible').animate({opacity: 1}, 200);
          setVideoReplayTimeout(ev.target, replayTimeout);

        } else if (ev.data === 3) {
          // If a video starts buffering, clear the timeout so we don't replay the video
          // too soon. When it resumes playing, we'll set a new timeout for its remaining
          // time.
          window.clearTimeout(replayTimeout);

        } else if (ev.data === 0) {
          // As a fallback, if the end of the video is reached, replay.
          window.clearTimeout(replayTimeout);
          replayVideo(ev.target);
        }
      };
    };

    // Add a handler that the YouTube Player API will call. Needs to be global.
    window.onYouTubeIframeAPIReady = function() {
      $youtubeVideos.each(function(i, video) {
        var $video = lp.jQuery(video);
        var replayTimeout; // Create a timeout object scoped to just this video

        // Hide the video and only show it once it has buffered, to hide the loading
        // animation. We bypass this on IE because the YouTube IFrame API does not
        // initialize properly when the video isn't visible.
        if ( ! lp.jQuery.browser.msie) {
          $video.css('visibility', 'hidden');
        }

        return new window.YT.Player($video.attr('id'), {
          events: {
            onReady: onVideoReady,
            onStateChange: onVideoStateChange(replayTimeout, $video)
          },
          playerVars: {
            html5: 1
          }
        });
      });
    };

    // Load the YouTube Player API script.
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  };

  var configureVimeoVideos = function() {
    var $vimeoFrames = lp.jQuery('.lp-pom-video-background-iframe-vimeo');

    if ($vimeoFrames.length === 0) { return; }

    $vimeoFrames.css({
      visibility: 'hidden',
      opacity: 0
    });

    $vimeoFrames.each(function(i, video) {
      var player = new Vimeo.Player(video.id);
      var $video = lp.jQuery(video);

      player.ready().then(function() {
        player.setAutopause(false);
        player.setVolume(0);
        player.setLoop(true);
        player.play();
      });

      var showVideoFrame = function() {
        // We stop listening to vimeo time events here as we only care
        // to know when the video initially starts playing
        player.off('timeupdate', showVideoFrame);

        $video.css('visibility', 'visible').animate({opacity: 1}, 200);
      };

      player.on('timeupdate', showVideoFrame);
    });
  };

  var loadVimeoAPI = function() {
    lp.jQuery.ajax({
      dataType: 'script',
      async: true,
      success: configureVimeoVideos,
      url: 'https://player.vimeo.com/api/player.js'
    });
  };

  var getPomElementRatio = function($pomElement) {
    if ($pomElement.attr('id') === 'lp-pom-root') {
      return lp.jQuery(window).width() / lp.jQuery(window).height();
    } else {
      return $pomElement.width() / $pomElement.height();
    }
  };

  var getAdjustmentCssRules = function($pomElement) {
    var $container = $pomElement.children('.lp-pom-video-background');
    var videoRatio = parseFloat($container.attr('data-ratio'));
    var pomElementRatio = getPomElementRatio($pomElement);

    var ratioDifference;
    if (videoRatio > pomElementRatio) {
      // Video is wider than element, cut off left and right
      ratioDifference = (videoRatio / pomElementRatio) - 1;
      return {
        top    : 0,
        left   : - Math.ceil((ratioDifference / 2) * 100) + '%',
        height : '100%',
        width  : Math.ceil(100 + ratioDifference * 100) + '%'
      };
    } else {
      // Element is wider than video, cut off top and bottom
      ratioDifference = (pomElementRatio / videoRatio) - 1;
      return {
        top    : - Math.ceil((ratioDifference / 2) * 100) + '%',
        left   : 0,
        height : Math.ceil(100 + ratioDifference * 100) + '%',
        width  : '100%'
      };
    }
  };

  var adjustOneVideo = function(i, pomElement) {
    var $pomElement = lp.jQuery(pomElement);
    var $container = $pomElement.children('.lp-pom-video-background');
    var $videoIframe = $container.children('.lp-pom-video-background-iframe');
    var $videoImage = $container.children('.lp-pom-video-background-image');

    if (window.lp.ubBrowser.isMobile()) {
      $videoIframe.remove();
    }

    $videoIframe
      .add($videoImage)
      .css(getAdjustmentCssRules($pomElement));
  };

  var adjustVideoBackgrounds = function() {
    lp.jQuery('.lp-pom-video-background')
      .parent('.lp-pom-block, .lp-pom-root')
      .each(adjustOneVideo);
  };

  lp.jQuery(document).ready(adjustVideoBackgrounds);
  lp.jQuery(window).resize(adjustVideoBackgrounds);

  lp.jQuery(document).ready(function() {
    muteAndLoopYoutubeVideos();
    loadVimeoAPI();
  });
})();