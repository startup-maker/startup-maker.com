/* globals lp */

// version 0.3
;(function($){
  window.lp = window.lp || {};
  window.lp.image = window.lp.image || {};

  $(document).ready(function(){lp.image.main.start();});
  $(window).resize(function(){lp.image.main.start();});

  lp.image.main = (function(){

    var _getImageURLFromElmCSS = function(elm) {
      return $(elm)
        .css('background-image')
        .replace(/['"]/g, '')
        .slice(4, -1);
    };

    var _sizeImageByBreakpoint = function(id, elm) {
      var imageId = $(elm).attr('id').split('-holder')[0];
      var $image = $('#' + imageId + ' img');
      $image.attr('src', _getImageURLFromElmCSS(elm));
    };

    var _loadImageByBreakpoint = function() {
     $.each($('.lp-pom-image-holder'), _sizeImageByBreakpoint);
    };

    var _start = function() {
      _loadImageByBreakpoint();
    };

    return {
      start: _start
    };
  })();

})(lp.jQuery);