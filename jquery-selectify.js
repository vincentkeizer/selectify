/*
 * File:        jquery-selectify.js
 * Version:     0.1
 * Author:      Vincent Keizer (www.vicreative.nl)
 * Info:        www.vicreative.nl/projects/selectify
 * 
 * Copyright 2012-2013 Vincent Keizer, all rights reserved.
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * 
 */
(function ($) {

  var methods = {
      init: function (options) {

        var settings = $.extend({
            'maxItems': 10
        }, options);

       return $(this).each(function(){
         var $this = $(this);
         var data = $this.data('selectify');
         
         // If the plugin hasn't been initialized yet
         if (!data) {
             var checkText = function (text) {
                 if ($this.data("selectify").text == text) {
                     $this.data("selectify").text = "";
                }
            };
             var select = $('<div />', {
                 "class": 'selectify',
                 "tabindex": "0",
                 focus: function (event) {
                     target = event.originalEvent ? event.originalEvent.explicitOriginalTarget || event.originalEvent.srcElement : null;
                     if ($(this).hasClass("focus") && $(this).hasClass("open")) {
                         return;
                     }
                     else if (!$(this).hasClass("open") && (target == null || !$this.has($(target)))) {
                         $(this).trigger("open");
                     }
                     $(this).trigger("activate");
                 },
                 focusout: function () {
                     $(this).removeClass("focus")
                            .trigger("close")
                            .unbind("keydown");
                 }
             });

             select.bind("close", function () {
		       if ($(this).hasClass("open"));
		       {
		           $(this).removeClass("open")
                          .find(".options").slideUp();
		       }
		   });

             select.bind("open", function () {
               if (!$(this).hasClass("open"));
               {
                   $(this).addClass("open")
                          .find(".options").slideDown("fast", function () {
                              $(this).trigger("scrollTo", $(this).children(".option.active"));
                          });
               }
           });
           
           select.bind("scrollTo", function (selector, element) {
               if (!element || typeof element != "object" || !$(element).length) { return; }
               var $element = $(element);
               var currentPos = $(this).find(".options").scrollTop();
               var selectedPos = $element.position().top + currentPos;
               var containerHeight = $(this).find(".options").height();
               if (selectedPos < currentPos) {
                   $(this).find(".options").scrollTop(selectedPos);
               }
               else if (selectedPos + $element.outerHeight() >= currentPos + containerHeight) {
                   $(this).find(".options").scrollTop(selectedPos - (containerHeight - $element.outerHeight()));
               }
           });

           select.bind("activate", function () {
               $(this).addClass("focus")
                      .unbind("keydown")
                      .keydown(function (e) {
                          switch (e.which) {
                              case 40:
                                  var hover = $(this).find(".option.hover");
                                  if (!hover.length) {
                                      hover = $(this).find(".option.active");
                                  }
                                  var next = hover.next();
                                  if (!next.length) {
                                      next = $(this).find(".option:first");
                                  }
                                  $(this).trigger("select", next);
								  e.preventDefault();
								  return false;
                                  break;
                              case 38:
                                  var hover = $(this).find(".option.hover");
                                  if (!hover.length) {
                                      hover = $(this).find(".option.active");
                                  }
                                  var prev = hover.prev();
                                  if (!prev.length) {
                                      prev = $(this).find(".option:last");
                                  }
                                  $(this).trigger("select", prev);
								  e.preventDefault();
								  return false;
                                  break;
                              case 13:
                                  $(this).trigger("close");
                                  break;
                              default:
                                  var char = String.fromCharCode(e.which);
                                  if (!char) {
                                      $this.data("selectify").text = "";
                                      break;
                                  }
                                  var text = $this.data("selectify").text || "";
                                  text = text + char.toLowerCase();
                                  $this.data("selectify").text = text;
                                  setTimeout(function () {
                                      checkText(text);
                                  }, 1000);

                                  var found = $(this).find(".option[data-text^='" + text + "']:first");
                                  if (found.length) {
                                      $(this).trigger("select", found);
                                  }
                                  break;
                          }
                      });
           });

           select.bind("select", function (selector, selected) {
               if (!selected) {
                   return;
               }
               if (typeof selected == "string")
               {
                   $(this).find(".option[data-id='" + selected + "']:not(.active)").click();
                   return;
               }
               if (typeof selected == "object") {
                   var $selected = $(selected);
                   var id = $selected.attr("data-id");
                   $this.val(id);
                   $(this).find(".selected").attr("data-id", id)
                                            .text($selected.text());
                   $(this).find(".option.active").removeClass("active");
                   $selected.addClass("active");
                   $(this).find(".option.hover").removeClass("hover");
                   $(this).trigger("scrollTo", $selected);
               }
           });

		   var options = $("<div />", {
		       "class": 'options'
		   });
		   var selected = $("<div />", {
		       "class": 'selected',
		       "data-id": $this.children(":selected").val(),
		       text: $this.children(":selected").text()
		   });

		   var header = $("<div />", {
		       "class": "header",
		       click: function () {
		           if ($(this).parent().hasClass("open")
                    && $(this).parent().hasClass("focus"))
		           {
		               $(this).trigger("close");
		           }
		           else if (!$(this).parent().hasClass("focus"))
		           {
		               $(this).trigger("activate");
		           }
		           else
		           {
		               $(this).trigger("open");
		           }
		       },
		       mouseover: function () {
		           $(this).addClass("hover");
		       },
		       mouseout: function () {
		           $(this).removeClass("hover");
		       }
		   });

		   var icon = $("<div />", {
		       "class": "icon"
		   });

		   $this.children().each(function () {
		       var option = $('<div />', {
		           "class": "option",
		           "data-id": $(this).val(),
                   "data-text": $(this).text().toLowerCase(),
		           text: $(this).text(),
		           click: function () {
		               $(this).trigger("select", this)
                              .trigger("close");
		           },
		           mouseover: function () {
		               $(this).siblings().removeClass("hover");
                       $(this).addClass("hover");
		           },
		           mouseout: function () {
		               $(this).removeClass("hover");
		           }
		       });
		       options.append(option)
		   });
           select.append(header.append(selected)
                               .append(icon))
                 .append(options);
           $this.before(select);
           
           var width = options.outerWidth() + icon.outerWidth();
           options.width(width);
           select.width(width)
           options.css("max-height", settings.maxItems * options.children().outerHeight()).hide();

           $this.data('selectify', {
               target: $this,
               selectify: select,
               text : ""
           }).change(function () {
               $(this).data("selectify").selectify.trigger("select", $(this).val());
           }).hide();
         }
       });
     },
     destroy : function( ) {
         return this.each(function () {
             var $this = $(this),
                 data = $this.data('selectify');
             if (data) {
                 $(window).unbind('.selectify');
                 data.selectify.remove();
                 $this.removeData('selectify');
				 $this.show();
             }
         });
     },
     open : function ()
     {
         return this.each(function () {
             var data = $(this).data("selectify");
             if (data) {
                 data.selectify.focus();
             }
         });
     },
     close : function ()
     {
         return this.each(function () {
             var data = $(this).data('selectify');
             if (data) {
                 data.selectify.blur();
             }
         });
     },
     update : function (content)
     {
         return this.each(function () {
             var data = $(this).data('selectify');
             if (data) {
                 data.selectify.trigger("select", content);
             }
         });
     }
  };

  $.fn.selectify = function( options ) {
      var method = options;
	if ( methods[method] ) {
		return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
	} else if ( typeof method === 'object' || ! method ) {
		return methods.init.apply( this, arguments );
	} else {
		$.error( 'Method ' +  method + ' does not exist on jQuery.selectify' );
	}
  };

})( jQuery );