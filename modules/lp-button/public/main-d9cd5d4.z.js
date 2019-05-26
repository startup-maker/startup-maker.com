/* globals lp */
//VERSION 2.1

;(function() {

  var ButtonMain = function(_jQuery, _storage, _window) {

    // Public: called by a page insertion added by button_element.js
    var registerAssetButton = function(buttonId, assetUuid) {
      _jQuery(_window.document).ready(function() {
        _jQuery('#' + buttonId).bind('click.assetDownload', _handleAssetButtonClick(assetUuid));
      });
    }

    var _handleAssetButtonClick = function(assetUuid) {
      return function(e) {
        e.preventDefault();
        e.stopPropagation();

        var assetUrl;
        try {
          assetUrl = _window.parent.module.lp.form.responseData.protectedAssets[assetUuid];
        } catch (e) {
          // For embeddables we can't store the protected assets on the parent window as we
          // do for lightboxes, because it's on a different domain. Instead, we fall back to
          // storing them in sessionStorage instead.
          // TODO: Remove this try/catch and exclusively use sessionStorage once we
          // have validated that its browser support is viable.
          assetUrl = _getAssetUrlFromStorage(assetUuid);
        }

        if (assetUrl) {
          _window.open(assetUrl, '_blank');
        }
      }
    }

    var _getAssetUrlFromStorage = function(assetUuid) {
      if (_storage) {
        return _storage.getItem('ub-asset-' + assetUuid);
      }
    };

    var _addCloseButtonClickHandlers = function() {
      _jQuery('.lp-pom-button.lp-pom-button-close').bind('click.close',
        _handleCloseButtonClick);
    };

    var _handleCloseButtonClick = function(e) {
      e.preventDefault();

      if (_window.lp.embeddable) {
        _window.lp.embeddable.closeOverlay();
      }
    };

    var _preloadBackgroundImages = function() {
      var regexBgImage = /\s*background-image\s*:\s*url\(\s*["']?([^"']+?)["']?\s*\)/g;
      var regexStart = /#lp-pom-button-\d+\s*\:\s*(hover|active)\s*{\s*/g;
      var regexEnd = /[}]/g;
      var urls = [];
      var start;
      var cssPiles = _jQuery('head style[title=page-styles]').html().split('\n');
      for (var j = 0; j < cssPiles.length; j++){
        var cssLine = cssPiles[j];
        while (regexStart.exec(cssLine)){
          start = 'true';
        }
        if (start === 'true'){
          var matches;
          /* jshint boss:true */
          while (matches = regexBgImage.exec(cssLine)) {
            var url = matches[1];
            if (lp.jQuery.inArray(url, urls) === -1) {
              urls.push(url);
            }
          }
          while (regexEnd.exec(cssLine)){
            start = 'false';
          }
        }
      }
      for (var i = 0, l = urls.length; i < l; i++) {
        _window.document.createElement('img').src = urls[i];
      }
    };

    _jQuery(_window.document).ready(function() {
      _addCloseButtonClickHandlers();
      _preloadBackgroundImages();
    });

    return {
      registerAssetButton: registerAssetButton,

      _handleAssetButtonClick: _handleAssetButtonClick,
      _handleCloseButtonClick: _handleCloseButtonClick
    }
  };

  var isTestEnv = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');

  if (isTestEnv) {
    module.exports = ButtonMain;
  } else {
    // In browser
    window.lp = window.lp || {};
    window.lp.button = window.lp.button ||
      ButtonMain(window.lp.jQuery, window.sessionStorage, window);
  }
})();