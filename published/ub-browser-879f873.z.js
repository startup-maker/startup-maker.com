/* globals lp */
/* helper methods to check for mobile devices */
/* replace with modernizr in the future if needed*/
;(function(){

  window.lp = window.lp || {};
  window.lp.ubBrowser = (function() {
    var mobileRegex = new RegExp('Android|webOS|iPhone|iPad|iPod|PlayBook|' +
        'Windows Phone|IEMobile|WPDesktop', 'i');

    var isMobile = function() {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return mobileRegex.test(userAgent);
    };

    var isPostMessageSupported = function() {
      return typeof window.postMessage === 'function' &&
        typeof window.addEventListener === 'function';
    };

    var getBrowserScrollbarWidth = function() {
      var outer = document.createElement("div");
      outer.style.visibility = "hidden";
      outer.style.width = "100px";
      outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

      document.body.appendChild(outer);

      var widthNoScroll = outer.offsetWidth;
      // force scrollbars
      outer.style.overflow = "scroll";

      // add innerdiv
      var inner = document.createElement("div");
      inner.style.width = "100%";
      outer.appendChild(inner);

      var widthWithScroll = inner.offsetWidth;

      // remove divs
      outer.parentNode.removeChild(outer);

      return widthNoScroll - widthWithScroll;
    };

    var adjustOverlayWidth = function(targetWindow) {
      targetWindow = targetWindow || window;

      var $overlayWrap = targetWindow.lp.jQuery('#ubpoverlay-wrap');

      // To detect whether lightbox has horizontal scrollbar
      // wait for the lightbox iframe to load, extract width of the content
      // and compare it with width of container.
      // Add and extra few pixels on the lightbox container to prevent horizontal scroll
      targetWindow.lp.jQuery('iframe#ubpoverlay-frame').load(function() {
        
        // contentWindow.document.body needed for <= IE8
        // http://stackoverflow.com/questions/4310946/iframe-contentdocument-not-working-in-ie8-and-ff3-5-and-below-any-other-ste
        var docBody = this.contentDocument ? this.contentDocument.body : this.contentWindow.document.body;

        var $contentWidth = targetWindow.lp.jQuery(docBody).width();
        var containerWidth = $overlayWrap.width();
        var adjustedWidth = containerWidth + getBrowserScrollbarWidth();

        if ($contentWidth < containerWidth) {
          $overlayWrap.css({width: (adjustedWidth)});
          targetWindow.lp.jQuery('#ubpoverlay-content').css({width: (adjustedWidth)});
        }
      });
    };

    // Public API
    return {
      isMobile: isMobile,
      isPostMessageSupported: isPostMessageSupported,
      getBrowserScrollbarWidth: getBrowserScrollbarWidth,
      adjustOverlayWidth: adjustOverlayWidth
    };
  })();

})();