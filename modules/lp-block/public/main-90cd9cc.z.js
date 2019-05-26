/* globals lp */

  // Fix bleeding between page sections on iOS
  lp.jQuery(function() {
    if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
      var sectionElms = lp.jQuery('.lp-pom-block'),
        addNegMargin = true;

      sectionElms.each(function(index, pageSectionElm) {
        var $pageSection = lp.jQuery(pageSectionElm);
        var containsGap = parseFloat($pageSection.css('margin-bottom')) > 0;
        var containsBottomBorder = parseFloat($pageSection.css('border-bottom-width')) > 0;
        var newMarginTop = '-1px';
        var newBottomPadding = '1px';

        if ((index === 0) || ! addNegMargin) {
          newMarginTop = '0px';
          addNegMargin = true;
        }

        if (containsGap || containsBottomBorder || (index === (sectionElms.length - 1))) {
          newBottomPadding = '0px';
          addNegMargin = false;
        }

        $pageSection.css({
          'margin-top': newMarginTop,
          'padding-bottom': newBottomPadding
        });
      });
    }
  });