;(function() {
  var lp = window.lp || {};
  window.lp = lp;

  if (!Array.prototype.some) {
    Array.prototype.some = function(fun/*, thisArg*/) {
      'use strict';

      if (this === null) {
        throw new TypeError('Array.prototype.some called on null or undefined');
      }

      if (typeof fun !== 'function') {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;
      var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
      for (var i = 0; i < len; i++) {
        if (i in t && fun.call(thisArg, t[i], i, t)) {
          return true;
        }
      }
      return false;
    };
  }

  var hasCustomCSS = (function() {
    var any = function(list0, predicate) {
      var list = lp.jQuery.makeArray(list0);
      return list && list.length > 0 && list.some(predicate);
    };

    var isCustomStylesheet = function(stylesheet) {
      var node = stylesheet.ownerNode;

      return node.tagName === 'STYLE' && node.getAttribute('data-page-type') === null;
    };

    var _selectorMatchers = [
      'h1', 'h2', 'h3', 'h4', 'span', '.lp-pom-text',
      // and regexes for id matches
        /^\#lp\-pom\-text\-/
    ];
    var isRelevantSelectorSegment = function(selectorSegment) {
      return any(_selectorMatchers, selectorSegment.match.bind(selectorSegment));
    };

    var isRelevantSelector = function(selector) {
      var isNotEmpty = function(v) {return v && v.length > 0;};
      var wordSplit  = selector.split(/[^\#\.\-\_0-9a-z]/i).filter(isNotEmpty);

      return any(wordSplit, isRelevantSelectorSegment);
    };

    var _ruleMatchers = [
      'font-family',
      'font-size',
      'font-weight',
      'font-height',
      'letter-spacing'
    ];
    var isRelevantStyle = function(style) {
      return any(_ruleMatchers, style.match.bind(style));
    };

    var isRelevantCSSRule = function(rule) {
      var relevant = (isRelevantSelector(rule.selectorText) &&
                      any(rule.style, isRelevantStyle));
      return relevant;
    };

    return function hasCustomCSS() {
      var customSheets = lp.jQuery(document.styleSheets)
        .filter(function (i, s) {
          return isCustomStylesheet(s);
        });
      return any(customSheets, function(sheet) {
        return any(sheet.rules, isRelevantCSSRule);
      });
    };
  })();

  function ub_getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);

    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var ub_log = function() {};

  if (ub_getParameterByName('ub-debug')) {
    ub_log = function(msg) {
      var debugDiv = lp.jQuery("#ub-debug");
      if (debugDiv.length < 1) {
        debugDiv = lp.jQuery(
          '<div id="ub-debug" style="word-wrap:break-word;background-color: yellow;position: absolute;'+
            'z-index:3000;top: 20px; left: 20px;"></div>')
          .prependTo('#lp-pom-root');
      }
      debugDiv.append('<div>' + msg + '</div>');
    };
  }

  function getHeightErrorAllowance() {
    //height error allowance of 16 is so to compensate for browser
    //differences on how it calculates the height.  We need this
    //because there is a very good chance that the browser
    //(different browser being used for editing and publishing will
    //change very slightly on how it calculates the height (font
    //size difference etc.) 16 is an arbitrary number that seems
    //to cover most cases.
    var viewportWidth = window.innerWidth;

    if (viewportWidth <= 600) {
      // On mobile we allow for a greater height difference than on desktop as
      // text boxes are generally narrower and longer on mobile
      return 32;
    }

    return 16;
  }

  lp.text = {
    _heightErrorAllowance: getHeightErrorAllowance(),
    _getTextElementMetrics: function() {
      var metrics = {};
      this.textElements.each(function(i, e) {
        metrics[e.id] = {
          designHeight: parseInt(lp.jQuery(e).css('height'), 10)
        };
      });
      return metrics;
    },

    _NO_SUB_PIXEL: 'no-sub-pixel',

    adjustTextHeight: function(e, designHeight) {
      var el = lp.jQuery(e)[0];
        if (!el) {
          return;
        }
      var adjust = 0;
      var tolerance = this._heightErrorAllowance;
      adjust = this._applySubPixelLetterSpacingFix(el, designHeight, tolerance);
      if (adjust === this._NO_SUB_PIXEL) {
        adjust = this._adjustIfSubPixelNotEnough(el, designHeight, tolerance);
      }
      ub_log(el.getAttribute('id') + ' ' + adjust);
    },

    _adjustIfSubPixelNotEnough: function(el, designHeight, tolerance) {
      var adjust = this._applyWordSpacing1PxFix(el);

      if ((el.offsetHeight + tolerance) < designHeight) {
        // it shrank too far. Revert and apply a width fix instead
        el.style.wordSpacing = '0px';
        adjust = 'word-spacing: 0px; width ' + this._applyWidthIncreaseFix(el, designHeight, tolerance, 10);
      } else if ((el.offsetHeight - tolerance) > designHeight) {
        // it didn't shrink far enough.
        var maxAdjust = 30;
        adjust = 'word-spacing: -1px; width ' + this._applyWidthIncreaseFix(el, designHeight, tolerance, maxAdjust);
      }
      return adjust;
    },

    _applySubPixelLetterSpacingFix: function(el, designHeight, tolerance, maxAdjust) {
      var initHeight = el.offsetHeight;
      var adjust = 0;
      maxAdjust = maxAdjust || -2;
      while ((el.offsetHeight - tolerance) > designHeight && adjust > maxAdjust) {
        adjust -= 0.05;
        el.style.letterSpacing = adjust + 'px';
        if (adjust >= -0.85 && el.offsetHeight === initHeight) {
          el.style.letterSpacing = '0px'; // reset
          return this._NO_SUB_PIXEL;
        }
      }
      return adjust;
    },

    _applyWordSpacing1PxFix: function(el) {
      el.style.wordSpacing = '-1px';
      return 'word-spacing: -1px';
    },

    _applyWidthIncreaseFix: function(el, designHeight, tolerance, maxAdjust) {
      var w = lp.jQuery(el).width();
      var adjust = 1;

      while ((el.offsetHeight - tolerance) > designHeight && adjust <= maxAdjust) {
        el.style.width = (w + adjust) + 'px';
        adjust++;
      }

      // attempt to fix the overlap that may have been introduced
      var currScale = this._getCurrentTransformMatrix(el);

      var oldXScale = lp.jQuery.trim(currScale[0]) || 1;
          oldXScale = oldXScale <= 1 ? oldXScale : 1;
      var scaleMultiplier = (1-(adjust/250));
      var xScale = ( scaleMultiplier * oldXScale ).toFixed(3);
      var yScale = lp.jQuery.trim(currScale[3]) || 1;

      var newScale = "scale(" + xScale + "," + yScale + ")";

      if (xScale < 1) {
        lp.jQuery(el).css({
          'transform'                : newScale,
          '-webkit-transform'        : newScale,
          'transform-origin'         : 'top left',
          '-webkit-transform-origin' : 'top left'
        });
      }

      return adjust;
    },

    _getCurrentTransformMatrix: function(el) {
     return lp.jQuery(el).css('-webkit-transform').slice(7,-1).split(', ');
    },

    _adjustTextHeightOLD: function(e, designHeight) {
      var adjust = 1;
      var maxAdjust = 50;
      var w = parseInt(lp.jQuery('#'+e.id).css('width'), 10);

      while ((lp.jQuery(e)[0].offsetHeight - this._heightErrorAllowance) > designHeight && adjust <= maxAdjust) {
        lp.jQuery(e)[0].style.width = (w + adjust) + 'px';
        adjust++;
      }
    },

    runTextFixes: function(timeout) {
      // An override to allow customers to prevent the text adjustments
      // in cases where the adjustments produce unexpected results
      if (window.ub.page.disableTextAdjustments) {
        return;
      }

      // If device is on iOS or desktop safari we need this workaround to make
      // sure that the text has rendered on the page before running fixTextHeights
      if (timeout) { // TODO: Remove with PB-2677
        setTimeout(this.fixTextHeights.bind(this), 250);
      } else {
        this.fixTextHeights();
      }
    },

    fixTextHeights: function() {
      //We need to know if they have custom css on the page.  The reason is, is because
      //the style could be altered by the user including the font size font weight etc.
      //this could have an impact on how fixTextHeights work. So, for now if we detect
      //any custom styles we will revert to the old way of adjusting the text.
      var runOldTextAdjust;

      try {
        runOldTextAdjust = hasCustomCSS(); //this._hasCustomCSS();
      } catch(e) {
        runOldTextAdjust = true;
        ub_log('Failed on lp-text/main#hasCustomCSS()');
        ub_log(e);
      }

      this.textElements = this.textElements || lp.jQuery(".lp-pom-text, .lp-form-label");
      this.textElementMetrics = this.textElementMetrics || this._getTextElementMetrics();

      var self = this;

      var textAdjust = runOldTextAdjust ? '98%' : 'none';
      lp.jQuery('head').append(
        '<style type="text/css">'+
          '@media only screen and (max-width: 480px), only screen and (max-device-width: 480px) {* {-webkit-text-size-adjust: ' + textAdjust + ';}}'+
            '</style>');

      this.textElements.each(function(i, e) {
        try {
          var designHeight = self.textElementMetrics[e.id].designHeight;

          var el = lp.jQuery(e)[0];
          el.style.height = 'auto';
          if(runOldTextAdjust) {
            self._adjustTextHeightOLD(e, designHeight);
          } else {
            if ((el.offsetHeight - self._heightErrorAllowance) > designHeight) {
              // allow control over which algo is used for testing-in-prod purposes
              // TODO: rm this debug code, but please not yet. It's been very helpful
              if (window.location.search.indexOf('none') === -1) {
                self.adjustTextHeight(el, designHeight);
              }
            }
          }

        } catch (err) {
          ub_log(e.id + ': ' + err);
        }
      });
    }
  };

  lp.jQuery(document).ready(function() {
    if(!(lp && lp.webFontLoad)) {
      // Remove with PB-2677
      lp.text.runTextFixes(true);
    }
  });
})();