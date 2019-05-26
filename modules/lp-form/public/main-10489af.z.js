// version 5.2
(function() {
  var FormMain = function(_window, __jQuery, ubModule) {
    var formContainer,
      formButton,
      errorContainer,
      errorLabelContainer,
      formSelector,
      ubafsFieldSelector,
      submitHeaders = {};

    var start = function() {
      setupSelectors();
      initialize();
      handleForm();
    };

    var setupSelectors = function() {
      formSelectors();
      errorSelectors();
    };

    var formSelectors = function() {
      formContainer = '#' + ubModule.lp.form.data.formContainerId;
      formButton = '#' + ubModule.lp.form.data.formButtonId;
      formSelector = formContainer + ' form';
      ubafsFieldSelector = formSelector + ' :input[name^="ubafs-"]';
    };

    var errorSelectors = function() {
      errorContainer = '#' + ubModule.lp.form.data.errorContainerId;
      errorLabelContainer = errorContainer + ' ul';
    };

    var handleForm = function() {
      copyURLParamsToFields();
      formSubmitHandler();
      adjustSelectBoxWidthForIE8();
    };

    var formSubmitHandler = function() {
      __jQuery(formSelector).keypress(function(e) {
        if (e.which === 13 && e.target.nodeName.toLowerCase() !== 'textarea') {
          e.preventDefault();
          __jQuery(formSelector).submit();
        }
      });
    };

    var positionErrors = function() {
      var errorWidth = __jQuery(errorContainer).outerWidth(true),
        formWidth = __jQuery(formContainer).outerWidth(true),
        totalWidth = formWidth + errorWidth,
        windowWidth = Math.min(__jQuery(_window).width(), _window.innerWidth);
      if (totalWidth < windowWidth) {
        positionErrorsOnMonitors(formWidth);
      } else {
        positionErrorsSmallScreens();
      }
    };

    var initErrorHide = function() {
      __jQuery(errorContainer).click(function() {
        __jQuery(errorContainer + ' .content ul ').toggleClass('hide');
        updateErrorToggle();
      });
    };

    var updateErrorToggle = function() {
      var $error = __jQuery(errorContainer);
      if (__jQuery(errorContainer + ' .content ul').is(':hidden')) {
        $error.find('.error-toggle').text('Show');
        $error
          .find('.error-toggle-arrow')
          .css('background-position', '0px -8px'); // Right-pointing triangle
        $error.find('ul').addClass('hide');
      } else {
        $error.find('.error-toggle').text('Hide');
        $error
          .find('.error-toggle-arrow')
          .css('background-position', '0px 1px'); // Down-pointing pointing triangle
        $error.find('ul').removeClass('hide');
      }
    };

    var positionErrorsOnMonitors = function(formWidth) {
      var formOffset = __jQuery(formContainer).offset(),
        rightEdgePosition = formOffset.left + formWidth + 16,
        docWidth = Math.min(
          __jQuery(_window.document).width(),
          _window.innerWidth
        ),
        rightEdge = docWidth - rightEdgePosition,
        errorWidthMargin = 280 + 16,
        shouldPositionLeft = rightEdge < 280;

      var left = shouldPositionLeft
        ? formOffset.left - errorWidthMargin
        : rightEdgePosition;
      if (left > 0) {
        var container = __jQuery(errorContainer);
        container.css({
          left: left + 'px',
          top:
            Math.max(
              formOffset.top,
              __jQuery(_window.document).scrollTop() + 4
            ) + 'px',
          width: '280px'
        });
        _window.onscroll = function() {
          handlePositioning(formOffset, container);
        };
      } else {
        // tablet!
        positionErrorsSmallScreens();
      }
    };

    var handlePositioning = function(formPosition, container) {
      var errorElTop = container.offset().top;
      var formElBottom = Math.round(errorElTop + container.innerHeight());
      var formHeight = __jQuery(formContainer).innerHeight();
      var formBottom = formPosition.top + formHeight;

      if (
        formBottom < formElBottom &&
        formPosition.top < __jQuery(_window.document).scrollTop()
      ) {
        container.css({ position: 'absolute' });
      } else if (formPosition.top < __jQuery(_window.document).scrollTop()) {
        container.css({
          position: 'absolute',
          top: __jQuery(_window.document).scrollTop()
        });
      } else {
        container.css({ position: 'absolute', top: formPosition.top });
      }
    };

    //Small screen error positioning is so that the error will display properly on mobile
    //devices.
    var positionErrorsSmallScreens = function() {
      __jQuery(errorContainer).css({
        position: 'fixed',
        left: '0px',
        right: '0px',
        top: '0px'
      });
    };

    var getParamsForSuccessModal = function(urlParams) {
      return urlParams ? urlParams.replace(/\?/g, '') : '';
    };

    var getOperatorToUseFromUrl = function(url) {
      return /\?/.test(url) ? '&' : '?';
    };

    var is404 = function() {
      if (_window.ub && _window.ub.page) {
        var paths = _window.ub.page.url.replace(/\/$/, '').split('/').slice(3);
        return paths.length === 1 && paths[0] === '404';
      } else {
        return false;
      }
    };

    var isPreview = function() {
      return location.hostname.indexOf('unbouncepreview.com') > -1;
    };

    var pageIsLightbox = function() {
      // The try/catch is necessary to avoid an exception being thrown if the parent is on
      // a different domain - e.g. when in preview.
      try {
        return (
          _window.ub &&
          _window.ub.page &&
          _window.ub.page.usedAs === 'lightbox' &&
          _window.parent !== _window &&
          _window.parent.lp &&
          _window.parent.lp.jQuery
        );
      } catch (err) {
        return false;
      }
    };

    var targetIsParent = function() {
      return (
        pageIsLightbox() || ubModule.lp.form.data.confirmTarget === '_parent'
      );
    };

    var pageIsEmbeddable = function() {
      // The file that defines window.lp.embeddable (embeddable.js) is only inserted onto embeddable
      // pages, so if that is present we are guaranteed to be on an embeddable.
      return typeof _window.lp.embeddable === 'object';
    };

    var buildSuccessModalUrl = function(data, form) {
      var pathPrefix = is404() && !isPreview() ? '/404/' : '';

      var modalUrlParts = data.url.split('?');
      var modalPath = pathPrefix + modalUrlParts[0];
      var modalParams = modalUrlParts[1];
      var thisPageParams = getParamsForSuccessModal(_window.location.search);
      /* Work around to not pass url params to Form confirmation dialog. To use add:
      <script>
        window.ub.page.noFormConfirmationUrlParams = true;
      </script>
      to your page
      TODO: remove with PB-2884 */
      var formParams = serializeFormData(form);
      if (window.ub && window.ub.page.noFormConfirmationUrlParams) {
        formParams = '';
      }
      // Re-order the URL parameters such that params included in the form confirmation
      // dialog URL come *after* the params lifted from the current page's URL. This is
      // necessary for preview to work.
      var params = __jQuery
        .grep(
          [thisPageParams, formParams, modalParams],
          function(str) {
            return str;
          } // removes empty param strings
        )
        .join('&');

      return modalPath + (params ? '?' : '') + params;
    };

    var isMobileAllowed = function(data) {
      var mediaQuery = 'screen and (max-width: 600px)';
      var mainPage = pageIsLightbox() ? _window.parent : _window;
      return (
        typeof mainPage.matchMedia === 'function' &&
        mainPage.matchMedia(mediaQuery).matches &&
        data.size.mobile
      );
    };

    var getModalSize = function(data) {
      var version = isMobileAllowed(data) ? 'mobile' : 'desktop';

      if (data.size[version]) {
        return {
          width: data.size[version].width,
          height: data.size[version].height
        };
      }

      return {
        width: data.size.width,
        height: data.size.height
      };
    };

    var isUsingIosDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    var showSuccessModal = function(data, form) {
      var path = buildSuccessModalUrl(data, form);
      var size = getModalSize(data);

      var targetWindow = pageIsLightbox() ? _window.parent : _window;

      if (
        !isPreview() &&
        pageIsEmbeddable() &&
        _window.lp.ubBrowser.isPostMessageSupported()
      ) {
        _window.lp.embeddable.replaceOverlayContent(
          _window.ub.page.url + path,
          data.size
        );
        return;
      }

      var targetWindowJQuery = targetWindow.lp.jQuery;
      var $body = targetWindowJQuery('body');

      this.overlay = targetWindowJQuery.ubpoverlay({
        href: path,
        padding: 0,
        type: 'iframe',
        onOverlayClick: false,
        width: size.width,
        height: size.height,
        onStart: function() {
          // We're opening a form confirmation dialog instead of a new-style lightbox, so
          // remove the class that adds extra styling.
          $body.removeClass('ub-lightbox-open');
        },
        onComplete: function() {
          targetWindow.lp.ubBrowser.adjustOverlayWidth(targetWindow);

          // Set focus to the iframe so that the form cannot get resubmitted by mistake.
          // This is related to issue LP-6580.
          targetWindowJQuery('#ubpoverlay-frame').focus();
        },
        onClosed: function() {
          // This is done to fix 'focus jumping' on iOS devices.
          if (isUsingIosDevice) {
            targetWindowJQuery('#ios-meta').remove();

            if (
              targetWindow.ub &&
              targetWindow.ub.page &&
              targetWindow.ub.page.storedScrollPosition
            ) {
              $body.scrollTop(targetWindow.ub.page.storedScrollPosition);
              delete targetWindow.ub.page.storedScrollPosition;
            }
          }
        }
      });

      var getAdjustedViewportHeight = function(height) {
        // returns viewport [width, height, left, top]
        var viewHeight = targetWindowJQuery.ubpoverlay.getViewport()[1];
        return height > viewHeight ? viewHeight : height;
      };

      targetWindowJQuery(_window).resize(function() {
        if (!$body.hasClass('ub-lightbox-open')) {
          // Presence of the ub-lightbox-open class means we're using the new lp.lightbox
          // ubpoverlay code, which doesn't require manual adjustments, unlike the code
          // still being used by the form confirmation dialog.
          var size = getModalSize(data);
          targetWindowJQuery(
            '#ubpoverlay-wrap, #ubpoverlay-outer, #ubpoverlay-content'
          ).css({
            width: size.width,
            height: getAdjustedViewportHeight(size.height)
          });

          targetWindowJQuery.ubpoverlay.resize();
        }
      });
    };

    var serializeFormData = function(form) {
      var array = __jQuery(form).serializeArray();
      var filteredArray = __jQuery.map(array, function(param) {
        return 'pageId' === param.name ||
        'pageVariant' === param.name ||
        /^ubafs-\w+/.test(param.name)
          ? null
          : param;
      });
      return __jQuery.param(filteredArray);
    };

    var getSuccessURL = function(url, form) {
      if (ubModule.lp.form.data.passParams) {
        return url + getOperatorToUseFromUrl(url) + serializeFormData(form);
      } else {
        return url;
      }
    };

    var navigateToURL = function(url) {
      var targetWindow = targetIsParent() ? _window.parent : _window;
      targetWindow.location.href = url;
    };

    var enableForm = function() {
      __jQuery(formButton).removeClass('disabled');
    };

    var disableForm = function() {
      __jQuery(formButton).addClass('disabled');
    };

    var isFormDisabled = function() {
      return __jQuery(formButton).hasClass('disabled');
    };

    var getFormAction = function(form) {
      var action = form.getAttribute('action');
      if (typeof action === 'object' && action.nodeType === 1) {
        var parent = action.parentNode;
        var node = parent.removeChild(action);
        action = getFormAction(form);
        parent.appendChild(node);
      }
      return action;
    };

    var setFormAction = function(form, url) {
      var action = form.getAttribute('action');
      if (typeof action === 'object' && action.nodeType === 1) {
        var parent = action.parentNode;
        var node = parent.removeChild(action);
        action = setFormAction(form, url);
        parent.appendChild(node);
      }

      if (ubModule.lp.form.data.passParams) {
        url = url + getOperatorToUseFromUrl(url) + serializeFormData(form);
      }

      form.setAttribute('action', url);

      if (targetIsParent()) {
        form.setAttribute('target', '_parent');
      }
    };

    var stripEmailField = function(validationRules) {
      __jQuery.each(validationRules, function(key, value) {
        if (value.email) {
          validationRules[key] = {
            required: {
              depends: function() {
                if (/\W$/.test(__jQuery(this).val())) {
                  __jQuery(this).val(__jQuery.trim(__jQuery(this).val()));
                }
                return value.required;
              }
            },
            email: true
          };
        }
      });
      return validationRules;
    };

    var _setPhoneValidator = function(type) {
      __jQuery.validator.addMethod(
        'phone',
        _phoneNumberValidator(type),
        'Please specify a valid phone number'
      );
    };

    var setValidateRules = function(validationData) {
      var validationType = validationData.validationType;
      var validationRules = ['generic', 'australian', 'uk', 'north-american'];
      if (
        validationType &&
        __jQuery.inArray(validationType, validationRules) > -1
      ) {
        _setPhoneValidator(validationType);
      }
    };

    var notFormPostOrRedirect = function() {
      return (
        __jQuery.inArray(ubModule.lp.form.data.confirmAction, [
          'url',
          'post'
        ]) === -1 || ubModule.lp.form.data.lightbox === true
      );
    };

    var highlightErrors = function(errorCount) {
      if (errorCount === 0) {
        __jQuery(errorContainer).hide();
      } else {
        var plural = errorCount > 1 ? ' errors' : ' error';
        var msg = 'Please fix the following ' + errorCount + plural + ':';
        __jQuery(errorContainer + ' .content .error .error-msg').text(msg);

        updateErrorToggle();
      }
    };

    var storeProtectedAssets = function(assets) {
      // For embeddables we can't store the protected assets on the parent window as we
      // do for lightboxes, because it's on a different domain. Instead, we fall back to
      // storing them in sessionStorage instead.
      // TODO: Remove this conditional and exclusively use sessionStorage once we
      // have validated that its browser support is viable.
      if (pageIsEmbeddable()) {
        __jQuery.each(assets, function(uuid, url) {
          sessionStorage.setItem('ub-asset-' + uuid, url);
        });
      } else {
        ubModule.lp.form.responseData = {
          protectedAssets: assets
        };
      }
    };

    var initialize = function() {
      positionErrors();
      initErrorHide();
      setValidateRules(ubModule.lp.form.data);

      __jQuery(formSelector).validate({
        rules: stripEmailField(ubModule.lp.form.data.validationRules),
        messages: ubModule.lp.form.data.validationMessages,
        errorContainer: errorContainer,
        errorLabelContainer: errorLabelContainer,
        wrapper: 'li',
        unhighlight: function(element, errorClass, validClass) {
          // Gets called when a field changes from invalid to valid. Hides the entire
          // error container if it contains no errors
          var errorCount = Object.keys(this.invalid).length;
          _window.setTimeout(highlightErrors.bind(this, errorCount), 5);

          // Retain the default functionality of `unhighlight`:
          __jQuery(element).removeClass(errorClass).addClass(validClass);
        },
        highlight: function(element, errorClass, validClass) {
          // Gets called when a field changes from valid to invalid. Hides the entire
          // error container if it contains no errors
          var errorCount = Object.keys(this.invalid).length;
          _window.setTimeout(highlightErrors.bind(this, errorCount), 5);

          // Retain the default functionality of `highlight`:
          __jQuery(element).addClass(errorClass).removeClass(validClass);
        },
        invalidHandler: positionErrors,
        focusInvalid: false,
        submitHandler: function(form) {
          if (isFormDisabled()) {
            return;
          }

          if (pageIsEmbeddable()) {
            _window.lp.embeddable.reportFormSubmit(
              ubModule.lp.form.data.isConversionGoal === true,
              ubModule.lp.form.data.confirmAction
            );
          }

          disableForm();

          __jQuery.ajax({
            url:
              getFormAction(__jQuery(form).get(0)) +
              '&lp-form-submit-method=ajax',
            type: 'POST',
            data: __jQuery(form).serialize(),
            beforeSend: function(xhr) {
              // Blur input focus to hide mobile keyboards if opened on form submission
              __jQuery(formSelector + ' .text').blur();
              // Add request headers stored in the outer scope submitHeaders variable
              // (added through public addSubmitHeaders method). Only allow headers that
              // start with X-Ub- as a security precaution.
              if (xhr && typeof xhr.setRequestHeader === 'function') {
                __jQuery.each(submitHeaders, function(key, value) {
                  if (/^X-Ub-/.test(key) && typeof value === 'string') {
                    xhr.setRequestHeader(key, value);
                  }
                });
              }
            },
            debug: true,
            error: function() {
              alert(
                ubModule.lp.form.data.errorMessage ||
                  "We're sorry the form could not be submitted because something went wrong. Please try again."
              );
            },
            success: function(data) {
              if (data.protected_assets) {
                storeProtectedAssets(data.protected_assets);
              }
              var $form = __jQuery(formSelector);
              var url;

              switch (ubModule.lp.form.data.confirmAction) {
                case 'url':
                  url = getSuccessURL(
                    ubModule.lp.form.data.confirmData,
                    form
                  ).replace(/\+/g, '%20');
                  navigateToURL(url);
                  break;

                case 'externalLightbox':
                  url = getSuccessURL(
                    ubModule.lp.form.data.confirmData,
                    form
                  ).replace(/\+/g, '%20');
                  if (
                    _window.lp.lightbox &&
                    ubModule.lp.form.data.lightbox &&
                    ubModule.lp.form.data.lightboxSize
                  ) {
                    _window.lp.lightbox.openLightbox(
                      url,
                      ubModule.lp.form.data.lightboxSize
                    );
                  } else {
                    navigateToURL(url);
                  }
                  break;

                case 'message':
                  alert(ubModule.lp.form.data.confirmData);
                  break;

                case 'modal':
                  showSuccessModal(ubModule.lp.form.data.confirmData, form);
                  break;

                case 'post':
                  $form.unbind();
                  setFormAction(
                    $form.get(0),
                    ubModule.lp.form.data.confirmData
                  );
                  __jQuery(ubafsFieldSelector).remove();
                  $form.submit();
                  break;
              }
            },
            complete: function() {
              if (notFormPostOrRedirect()) {
                enableForm();
                form.blur();
                form.reset();
              }
            }
          });
        }
      });
    };

    var copyURLParamsToFields = function() {
      if (_window.location.search.length < 1) {
        return;
      }

      var urlParamObj = getFilteredUrlParams(_window.location.search);

      Object.keys(urlParamObj).map(function(key) {
        var value = urlParamObj[key];
        replaceFormValues(key, value);
      });

      function replaceFormValues(name, value) {
        var inputEl = getFirstTextInputWithName(name);
        if (inputEl instanceof HTMLElement) {
          inputEl.value = decodeURLParam(value.join(','));
        }
      }

      function getFirstTextInputWithName(name) {
        return [
          ' input[name=' + name + ']',
          ' textarea[name=' + name + ']'
        ].reduce(function(inputs, selector) {
          var input = document.querySelector(formSelector + selector);

          if (!input) {
            return inputs;
          }

          if (
            input.type !== 'text' &&
            input.type !== 'hidden' &&
            input.type !== 'textarea'
          ) {
            return inputs;
          }

          return inputs.concat([input]);
        }, [])[0]; // only return the first match.
      }
    };

    var decodeURLParam = function(param) {
      try {
        if (__jQuery.isArray(param)) {
          // If there are multiple values for this param, use the last one.
          return decodeURIComponent(param[param.length - 1]);
        } else {
          return decodeURIComponent(param);
        }
      } catch (e) {
        // incoming URL parameters might be ASCII encoded. Force them to UTF-8.
        /* global unescape */
        return decodeURIComponent(encodeURIComponent(unescape(param)));
      }
    };

    //Handle ie8 select box not large enough issue as noted by lp-2467
    var adjustSelectBoxWidthForIE8 = function() {
      if (__jQuery.browser.msie && parseInt(__jQuery.browser.version, 10) < 9) {
        var el;
        __jQuery('select')
          .each(function() {
            el = __jQuery(this);
            el.data('origWidth', el.outerWidth());
          })
          .mousedown(function() {
            __jQuery(this).css('width', 'auto');
          })
          .bind('blur change', function() {
            el = __jQuery(this);
            el.css('width', el.data('origWidth'));
          });
      }
    };

    var getWindowLocation = function() {
      return _window.location.href;
    };

    var getFilteredUrlParams = function(searchParams) {
      var searchParamsArray = searchParams.replace('?', '').split('&');

      return searchParamsArray.reduce(function(searchObject, searchParam) {
        var splitParam = searchParam.split('=');

        var key = splitParam[0];
        var value = splitParam[1];

        if (isExcludedField(key)) {
          return searchObject;
        }

        if (searchObject[key]) {
          searchObject[key].push(value);
        } else {
          searchObject[key] = [value];
        }

        return searchObject;
      }, {});
    };

    var excludedFieldNames = ['pageid', 'pagevariant'];

    var isExcludedField = function(key) {
      return excludedFieldNames.reduce(function(isExcluded, excludedField) {
        return isExcluded || key.indexOf(excludedField) !== -1;
      }, false);
    };

    var addSubmitHeaders = function(headers) {
      // submitHeaders is declared in the outer scope and accessed in the form submitHandler.
      submitHeaders = __jQuery.extend({}, submitHeaders, headers);
    };

    function _phoneNumberValidator(type) {
      return function(value, element) {
        if (this.optional(element)) {
          return true;
        }

        var types = {
          uk: new RegExp(
            [
              '^',
              // // "0800 ######", spaces and parens optional
              '(',
              /(0800)\s?(\d{6})/.source,
              // // "01### #####", spaces and parens optional
              '|',
              /(01\d{3})\s?(\d{5})/.source,
              // "+44" or "(01111)"
              // and "111 111", spaces and parens optional
              '|',
              /((44\s?\d{4}|\(?0\d{4}\)?)\s?\d{3}\s?\d{3})/.source,
              // "+44" or "(0111)"
              // and "111 1111", spaces and parens optional
              '|',
              /((44\s?\d{3}|\(?0\d{3}\)?)\s?\d{3}\s?\d{4})/.source,
              // "+44" or "(011)"
              // and "1111 1111", spaces and parens optional
              '|',
              /((44\s?\d{2}|\(?0\d{2}\)?)\s?\d{4}\s?\d{4})/.source,
              ')',
              // " #(1111)" or " #(111)",
              // spaces and parens optional,
              // whole group optional
              /(\s?\#(\d{4}|\d{3}))?/.source,
              '$'
            ].join('')
          ),
          generic: /^\d{5,16}$/,
          australian: /^((0|61)(2|4|3|7|8)){0,1}[0-9]{2}[0-9]{2}[0-9]{1}[0-9]{3}$/,
          na: /^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/
        };

        return types[types.hasOwnProperty(type) ? type : 'na'].test(
          value.replace(/([+. \-()])/g, '')
        );
      };
    }

    return {
      getOperatorToUseFromUrl: getOperatorToUseFromUrl,
      getParamsForSuccessModal: getParamsForSuccessModal,
      serializeFormData: serializeFormData,
      buildSuccessModalUrl: buildSuccessModalUrl,
      getWindowLocation: getWindowLocation,
      getFilteredUrlParams: getFilteredUrlParams,
      getModalSize: getModalSize,
      start: start,
      addSubmitHeaders: addSubmitHeaders,
      _phoneNumberValidator: _phoneNumberValidator
    };
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = FormMain;
  } else {
    //The reason for the two versions is because we are currently using window.module
    //which will conflict with some thirdparty libraries.  We cannot modify all
    //the pages because many users have created custom scripts refering to
    //window.module;  Instead we will keep users on window.module unless they
    //report problems, when they do we will switch their account to use
    //window.ubModule.
    var ubModule = window.ubModule ? window.ubModule : window.module || {};

    ubModule.lp = ubModule.lp || {};
    ubModule.lp.form = ubModule.lp.form || {};
    ubModule.lp.form.data = null;

    window.lp = window.lp || {};
    window.lp.form = window.lp.form || {};
    window.lp.form.main = window.lp.form.main || {};

    // in browser
    if (window.lp.jQuery) {
      window.lp.form.main = FormMain(window, window.lp.jQuery, ubModule);

      window.lp.jQuery(window.document).ready(function() {
        if (ubModule.lp.form.data) {
          window.lp.form.main.start();
        }
      });
    }
  }
})();