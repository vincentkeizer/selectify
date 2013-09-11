/*
 * File:        jquery-selectify.js
 * Version:     0.2
 * Author:      Vincent Keizer (www.vicreative.nl)
 * Info:        www.vicreative.nl/projects/selectify
 *
 * Copyright 2012-2013 Vincent Keizer, all rights reserved.
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */
(function ($) {
    // Helper methods for selectify
    var helper = {
        checkText: function (select, text) {
            // Checks if current text is still valid for keyboard input.
            if (select.data("selectify").text == text) {
                select.data("selectify").text = "";
            }
        }
    };

    // Events for selectify
    var events = {
        // Event fired when select element is activated.
        activate: function (event) {
            $(this).addClass("state-focus")
                   .unbind("keydown")
                   .keydown(function (e) {
                       switch (e.which) {
                           case 40:
                               var hover = $(this).find(".option.state-hover");
                               if (!hover.length) {
                                   hover = $(this).find(".option.state-active");
                               }
                               var next = hover.next();
                               if (!next.length) {
                                   next = $(this).find(".option:first");
                               }
                               $(this).trigger("select", next);
                               e.preventDefault();
                               return false;
                           case 38:
                               var hover = $(this).find(".option.state-hover");
                               if (!hover.length) {
                                   hover = $(this).find(".option.state-active");
                               }
                               var prev = hover.prev();
                               if (!prev.length) {
                                   prev = $(this).find(".option:last");
                               }
                               $(this).trigger("select", prev);
                               e.preventDefault();
                               return false;
                           case 13:
                               $(this).trigger("close");
                               break;
                           case 9:
                               $(this).trigger("removefocus");
                               break;
                           default:
                               var data = event.data.select.data("selectify");
                               var char = String.fromCharCode(e.which);
                               if (!char) {
                                   data.text = "";
                                   break;
                               }
                               var text = data.text || "";
                               text = text + char.toLowerCase();
                               data.text = text;
                               setTimeout(function () {
                                   helper.checkText(event.data.select, text);
                               }, 1000);

                               var found = $(this).find(".option[data-text^='" + text + "']:first");
                               if (found.length) {
                                   $(this).trigger("select", found);
                               }
                               break;
                       }
                   });
        },
        // Event fired when select receives focus.
        focus: function (event) {
            target = event.originalEvent ? event.originalEvent.explicitOriginalTarget || event.originalEvent.srcElement : null;
            if ($(this).hasClass("state-focus") && $(this).hasClass("state-open")) {
                return;
            }
            else if (!$(this).hasClass("state-open") && (target == null || event.data.select.has($(target)) || event.data.select.is($(target)))) {
                $(this).trigger("open");
            }

            $(this).trigger("activate");
        },
        // Event fired when select loses focus.
        blur: function (event) {
            var select = $(this);
            if (event.data && event.data.select) {
                select = event.data.select;
            }
            if (select.hasClass("state-open")) {
                select.removeClass("state-focus")
                   .trigger("close")
                   .unbind("keydown");
                $(document).unbind("click", events.blur);
            }
        },
        // Event fired when select is opened.
        open: function (event) {
            if (!$(this).hasClass("state-open")) {
                // IE 10 gives us problems when scrollbar is clicked, it sends an focusout event.
                $(document).click({ select: $(this) }, events.blur);
                event.preventDefault();
                $(this).find(".options").slideDown("fast", function () {
                    $(this).parents(".selectify").addClass("state-open");
                    $(this).trigger("scrollTo", $(this).find(".option.state-active"));
                });
                return false;
            }
        },
        // Event fired when select is closed.
        close: function () {
            if ($(this).hasClass("state-open"));
            {
                $(this).removeClass("state-open")
                       .find(".options").slideUp();
            }
        },
        // Event fired when select is scrolled.
        scroll: function (selector, element) {
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
        },
        // Event fired when an option in select is selected.
        select: function (event, selected) {
            if (!selected) {
                return;
            }
            if (typeof selected == "string") {
                $(this).find(".option[data-id='" + selected + "']:not(.state-active)").click();
                return;
            }
            if (typeof selected == "object") {
                var $selected = $(selected);
                var id = $selected.attr("data-id");
                event.data.select.val(id);
                $(this).find(".selected").attr("data-id", id)
                                         .attr("class", "selected" + ($selected.attr("data-class").length ? " " + $selected.attr("data-class") : ""))
                                         .find("span").text($selected.text());
                $(this).find(".option.state-active").removeClass("state-active");
                $selected.addClass("state-active");
                $(this).find(".option.state-hover").removeClass("state-hover");
                $(this).trigger("scrollTo", $selected);
                // Call change event on select to trigger other bound events.
                event.data.select.change();
            }
        },
        // Event fired when change event on original element is triggered.
        change: function () {
            $(this).data("selectify").selectify.trigger("select", $(this).val());
        }
    };

    var methods = {
        init: function (args) {
            var settings = $.extend({
                'maxItems': 10
            }, args);

            return $(this).each(function () {
                var $this = $(this);
                var data = $this.data('selectify');

                // If the plugin hasn't been initialized yet
                if (!data) {
                    var select = $('<div />', {
                        "class": 'selectify' + (this.className.length ? " " + this.className : ""),
                        "tabindex": "0"
                    }).bind("focus", { select: $this }, events.focus)
                      .bind("removefocus", events.blur)
                      .bind("close", events.close)
                      .bind("open", events.open)
                      .bind("scrollTo", events.scroll)
                      .bind("activate", { select: $this }, events.activate)
                      .bind("select", { select: $this }, events.select);

                    var options = $("<ul />", {
                        "class": 'options'
                    });
                    var selected = $("<div />", {
                        "class": 'selected' + ($this.children(":selected").attr("class") && $this.children(":selected").attr("class").length ? " " + $this.children(":selected").attr("class") : ""),
                        "data-id": $this.children(":selected").val()
                    }).append($("<div />", {
                        "class": "icon"
                    })).append($("<span />", {
                        text: $this.children(":selected").text()
                    }));

                    var header = $("<header />", {
                        click: function () {
                            if ($(this).parent().hasClass("state-open")
                             && $(this).parent().hasClass("state-focus")) {
                                $(this).trigger("close");
                            }
                            else if (!$(this).parent().hasClass("state-focus")) {
                                $(this).trigger("activate");
                            }
                            else {
                                $(this).trigger("open");
                            }
                        },
                        mouseover: function () {
                            $(this).addClass("state-hover");
                        },
                        mouseout: function () {
                            $(this).removeClass("state-hover");
                        }
                    });

                    var icon = $("<div />", {
                        "class": "icon"
                    });

                    $this.children().each(function () {
                        var option = $('<li />', {
                            "class": "option" + (this.className.length ? " " + this.className : ""),
                            "data-id": $(this).val(),
                            "data-text": $(this).text().toLowerCase(),
                            "data-class": this.className,
                            click: function () {
                                $(this).trigger("select", this)
                                       .trigger("close");
                            },
                            mouseover: function () {
                                $(this).siblings().removeClass("state-hover");
                                $(this).addClass("state-hover");
                            },
                            mouseout: function () {
                                $(this).removeClass("state-hover");
                            }
                        }).append($("<div />", {
                            "class": "icon"
                        }))
                        .append($("<span />", {
                            text: $(this).text()
                        }));
                        options.append(option);
                    });

                    select.append(header.append(selected)
                                       .append(icon))
                              .append(options)
                              .append($("<footer />"));
                    $this.before(select);

                    var width = options.outerWidth() + icon.outerWidth();
                    options.width(width);
                    select.width(width);
                    options.css("max-height", settings.maxItems * options.children().outerHeight()).hide();

                    $this.data('selectify', {
                        target: $this,
                        selectify: select,
                        text: ""
                    }).change(events.change).hide();
                }
            });
        },
        destroy: function () {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('selectify');
                if (data) {
                    $(window).unbind('.selectify');
                    data.selectify.remove();
                    $this.removeData('selectify')
                        .unbind("change", events.change)
                        .show();
                }
            });
        },
        open: function () {
            return this.each(function () {
                var data = $(this).data("selectify");
                if (data) {
                    data.selectify.focus();
                }
            });
        },
        close: function () {
            return this.each(function () {
                var data = $(this).data('selectify');
                if (data) {
                    data.selectify.trigger("removefocus");
                }
            });
        },
        update: function (content) {
            return this.each(function () {
                var data = $(this).data('selectify');
                if (data) {
                    data.selectify.trigger("select", content);
                }
            });
        }
    };

    $.fn.selectify = function (options) {
        var method = options;
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.selectify');
        }
    };
})(jQuery);