/**
 * multi.js
 * A user-friendly replacement for select boxes with multiple attribute enabled.
 *
 * Author: Fabian Lindfors
 * License: MIT
 *
 * Modified by Simon Carter on 25/4/2019 - Added ability to order selected items
 *
 */
var multi = (function() {
  var disabled_limit = false; // This will prevent to reset the "disabled" because of the limit at every click
  var selected_count = 0;
  var highlighted_option_obj = null;

  // Helper function to move an item in an Array
  var array_move = function(arr, old_index, new_index) {
    while (old_index < 0) {
      old_index += arr.length;
    }
    while (new_index < 0) {
      new_index += arr.length;
    }
    if (new_index >= arr.length) {
      let k = new_index - arr.length;
      while (k-- + 1) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
  };

  // Helper function to trigger an event on an element
  var trigger_event = function(type, el) {
    var e = document.createEvent("HTMLEvents");
    e.initEvent(type, false, true);
    el.dispatchEvent(e);
  };

  // Toggles the target option on the select
  var toggle_option = function(select, event, settings) {
    var option = select.options[event.target.getAttribute("multi-index")];

    if (option.disabled) {
      return;
    }

    option.selected = !option.selected;

    // Check if there is a limit and if is reached
    var limit = settings.limit;
    if (limit > -1) {
      // Count current selected
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].selected) {
          selected_count++;
        }
      }

      // Reached the limit
      if (selected_count === limit) {
        this.disabled_limit = true;

        // Trigger the function (if there is)
        if (typeof settings.limit_reached === "function") {
          settings.limit_reached();
        }

        // Disable all non-selected option
        for (var i = 0; i < select.options.length; i++) {
          var opt = select.options[i];

          if (!opt.selected) {
            opt.setAttribute("disabled", true);
          }
        }
      } else if (this.disabled_limit) {
        // Enable options (only if they weren't disabled on init)
        for (var i = 0; i < select.options.length; i++) {
          var opt = select.options[i];

          if (opt.getAttribute("data-origin-disabled") === "false") {
            opt.removeAttribute("disabled");
          }
        }

        this.disabled_limit = false;
      }
    }

    // Add new item to ordered list
    if (settings.ordering) {
      value = option.getAttribute("value");
      new_list = get_order_list(settings);
      new_list.push(value);
      set_order_list(settings, new_list);
    }

    trigger_event("change", select);
  };

  var get_order_list = function(settings) {
    current_list = settings.selected_order_list[0].value;
    return settings.ordering && current_list != ""
      ? current_list.split(",").map(s => s.trim())
      : [];
  };

  var set_order_list = function(settings, order_list) {
    settings.selected_order_list[0].value = order_list.join(",");
  };

  // Move a highlighted option
  var item_move = function(select, direction, settings) {
    value = highlighted_option_obj.getAttribute("value");
    selected_order_list = get_order_list(settings);
    current_position = selected_order_list.indexOf(value);
    new_index = current_position - direction;
    // Update order if not at the ends
    if (new_index > -1 && new_index < selected_order_list.length) {
      new_order = array_move(selected_order_list, current_position, new_index);
      set_order_list(settings, new_order);
    }
    trigger_event("change", select);
  };

  // Deselect the highlighted option
  var item_remove = function(select, settings) {
    highlighted_option_obj.selected = false;
    value = highlighted_option_obj.getAttribute("value");
    selected_order_list = get_order_list(settings);
    current_position = selected_order_list.indexOf(value);
    selected_order_list.splice(current_position, 1);
    set_order_list(settings, selected_order_list);
    trigger_event("change", select);
  };

  var highlight_option = function(row, enabled) {
    if (!row) {
      return;
    }
    highlight = row.classList.contains("highlight");
    if (highlight && !enabled) {
      row.classList.remove("highlight");
    } else if (!highlight && enabled) {
      row.classList.add("highlight");
    }
  };

  var select_option = function(select, event, settings) {
    var option = select.options[event.target.getAttribute("multi-index")];
    highlighted_option_obj = option;
    trigger_event("change", select);
  };

  // Refreshes an already constructed multi.js instance
  var refresh_select = function(select, settings) {
    // Clear columns
    select.wrapper.selected.innerHTML = "";
    select.wrapper.non_selected.innerHTML = "";

    selected_order_list = get_order_list(settings);
    if (settings.ordering) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].selected) {
          opt = select.options[i];
          value = opt.getAttribute("value");
          position = selected_order_list.indexOf(value);
          if (position != -1) {
            opt.setAttribute("sort-order", position);
          }
        }
      }
    }

    // Add headers to columns
    if (settings.non_selected_header && settings.selected_header) {
      var non_selected_header = document.createElement("div");
      var selected_header = document.createElement("div");

      non_selected_header.className = "header";
      selected_header.className = "header";

      non_selected_header.innerText = settings.non_selected_header;
      selected_header.innerText = settings.selected_header;

      select.wrapper.non_selected.appendChild(non_selected_header);
      select.wrapper.selected.appendChild(selected_header);
    }

    // Get search value
    if (select.wrapper.search) {
      var query = select.wrapper.search.value;
    }

    // Current group
    var item_group = null;
    var current_optgroup = null;

    // Loop over select options and add to the non-selected and selected columns
    for (var i = 0; i < select.options.length; i++) {
      var option = select.options[i];

      var value = option.value;
      var label = option.textContent || option.innerText;

      var row = document.createElement("a");
      row.tabIndex = 0;
      row.className = "item";
      row.innerHTML = label;
      row.setAttribute("role", "button");
      row.setAttribute("data-value", value);
      row.setAttribute("multi-index", i);

      if (option.disabled) {
        row.className += " disabled";
      }

      // Add row to selected column if option selected
      if (option.selected) {
        row.className += " selected";
        if (
          highlighted_option_obj &&
          option.value == highlighted_option_obj.value
        ) {
          row.className += " highlight";
        }
        currentSortIndex = option.getAttribute("sort-order");
        if (currentSortIndex == null) {
          currentSortIndex = selected_order_list.length - 1;
          option.setAttribute("sort-order", currentSortIndex);
        }
        row.setAttribute("sort-order", currentSortIndex);
        var clone = row.cloneNode(true);
        select.wrapper.selected.appendChild(clone);
      } else {
        currentSortIndex = option.getAttribute("sort-order");
        if (currentSortIndex != null) {
          option.removeAttribute("sort-order");
        }
      }

      // *** Need to reset indexes after removal

      // Create group if entering a new optgroup
      if (
        option.parentNode.nodeName == "OPTGROUP" &&
        option.parentNode != current_optgroup
      ) {
        current_optgroup = option.parentNode;
        item_group = document.createElement("div");
        item_group.className = "item-group";

        if (option.parentNode.label) {
          var groupLabel = document.createElement("span");
          groupLabel.innerHTML = option.parentNode.label;
          groupLabel.className = "group-label";
          item_group.appendChild(groupLabel);
        }

        select.wrapper.non_selected.appendChild(item_group);
      }

      // Clear group if not inside optgroup
      if (option.parentNode == select) {
        item_group = null;
        current_optgroup = null;
      }

      // Apply search filtering
      if (
        !query ||
        (query && label.toLowerCase().indexOf(query.toLowerCase()) > -1)
      ) {
        // Append to group if one exists, else just append to wrapper
        if (item_group != null) {
          item_group.appendChild(row);
        } else {
          select.wrapper.non_selected.appendChild(row);
        }
      }
    }

    // Sort selected items
    var items = select.wrapper.selected.querySelectorAll(".item");
    [].slice
      .call(items)
      .sort(function(a, b) {
        var indexA = a.getAttribute("sort-order");
        var indexB = b.getAttribute("sort-order");
        return indexA < indexB ? -1 : indexA > indexB ? 1 : 0;
      })
      .forEach(function(el) {
        el.parentNode.appendChild(el);
      });

    // Update ordering button status
    if (settings.ordering) {
      select.wrapper.remove_button.disabled = !highlighted_option_obj;
      select.wrapper.up_button.disabled = !(
        highlighted_option_obj &&
        highlighted_option_obj.getAttribute("sort-order") != 0
      );
      select.wrapper.down_button.disabled = !(
        highlighted_option_obj &&
        highlighted_option_obj.getAttribute("sort-order") !=
          selected_order_list.length - 1
      );
    }
  };

  // Intializes and constructs an multi.js instance
  var init = function(select, settings) {
    /**
     * Set up settings (optional parameter) and its default values
     *
     * Default values:
     * enable_search : true
     * search_placeholder : "Search..."
     * ordering : false
     */
    settings = typeof settings !== "undefined" ? settings : {};

    settings["enable_search"] =
      typeof settings["enable_search"] !== "undefined"
        ? settings["enable_search"]
        : true;
    settings["search_placeholder"] =
      typeof settings["search_placeholder"] !== "undefined"
        ? settings["search_placeholder"]
        : "Search...";
    settings["non_selected_header"] =
      typeof settings["non_selected_header"] !== "undefined"
        ? settings["non_selected_header"]
        : null;
    settings["selected_header"] =
      typeof settings["selected_header"] !== "undefined"
        ? settings["selected_header"]
        : null;
    settings["ordering"] =
      typeof settings["ordering"] !== "undefined"
        ? settings["ordering"]
        : false;
    settings["limit"] =
      typeof settings["limit"] !== "undefined"
        ? parseInt(settings["limit"])
        : -1;
    if (isNaN(settings["limit"])) {
      settings["limit"] = -1;
    }

    // Check if already initalized
    if (select.dataset.multijs != null) {
      return;
    }

    // Make sure element is select and multiple is enabled
    if (select.nodeName != "SELECT" || !select.multiple) {
      return;
    }

    // Hide select
    select.style.display = "none";
    select.setAttribute("data-multijs", true);

    // Start constructing selector
    var wrapper = document.createElement("div");
    wrapper.className = "multi-wrapper";

    // Add search bar
    if (settings.enable_search) {
      var search = document.createElement("input");
      search.className = "search-input";
      search.type = "text";
      search.setAttribute("placeholder", settings.search_placeholder);

      search.addEventListener("input", function() {
        refresh_select(select, settings);
      });

      wrapper.appendChild(search);
      wrapper.search = search;
    }

    // Add columns for selected and non-selected
    var non_selected = document.createElement("div");
    non_selected.className = "non-selected-wrapper";

    var selected = document.createElement("div");
    selected.className = "selected-wrapper";

    // Add keyboard handler to toggle the selected status
    wrapper.addEventListener("keypress", function(event) {
      var is_action_key = event.keyCode === 32 || event.keyCode === 13;
      var is_option = event.target.getAttribute("multi-index");

      if (is_option && is_action_key) {
        // Prevent the default action to stop scrolling when space is pressed
        event.preventDefault();
        toggle_option(select, event, settings);
      }
    });

    wrapper.appendChild(non_selected);
    wrapper.appendChild(selected);

    wrapper.non_selected = non_selected;
    wrapper.selected = selected;

    // Add click handler to toggle the selected status of a non-selected option
    wrapper.non_selected.addEventListener("click", function(event) {
      if (event.target.getAttribute("multi-index")) {
        toggle_option(select, event, settings);
      }
    });

    // Add click handler to highlight a selected option if ordering is enabled or toggle select if not
    wrapper.selected.addEventListener("click", function(event) {
      if (event.target.getAttribute("multi-index")) {
        if (settings.ordering) {
          select_option(select, event, settings);
        } else {
          toggle_option(select, event, settings);
        }
      }
    });

    // Add Ordering container and controls if enabled
    if (settings.ordering) {
      wrapper.className = wrapper.className + " ordering";

      var ordering = document.createElement("div");
      ordering.className = "ordering-wrapper";

      var up_button = document.createElement("input");
      up_button.setAttribute("type", "button");
      up_button.setAttribute("class", "move-up");
      up_button.setAttribute("value", "\u2191");
      up_button.addEventListener("click", function(event) {
        item_move(select, 1, settings);
      });

      var down_button = document.createElement("input");
      down_button.setAttribute("type", "button");
      down_button.setAttribute("class", "move-down");
      down_button.setAttribute("value", "\u2193");
      down_button.addEventListener("click", function(event) {
        item_move(select, -1, settings);
      });

      var remove_button = document.createElement("input");
      remove_button.setAttribute("type", "button");
      remove_button.setAttribute("class", "remove");
      remove_button.setAttribute("value", "\u2190");
      remove_button.addEventListener("click", function(event) {
        item_remove(select, settings);
      });

      ordering.appendChild(up_button);
      ordering.appendChild(remove_button);
      ordering.appendChild(down_button);

      wrapper.appendChild(ordering);
      wrapper.ordering = ordering;
      wrapper.up_button = up_button;
      wrapper.remove_button = remove_button;
      wrapper.down_button = down_button;
    }

    select.wrapper = wrapper;

    // Add multi.js wrapper after select element
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Save current state
    for (var i = 0; i < select.options.length; i++) {
      var option = select.options[i];
      option.setAttribute("data-origin-disabled", option.disabled);
    }

    // Initialize selector with values from select element
    refresh_select(select, settings);

    // Refresh selector when select values change
    select.addEventListener("change", function() {
      refresh_select(select, settings);
    });
  };

  return init;
})();

// Add jQuery wrapper if jQuery is present
if (typeof jQuery !== "undefined") {
  (function($) {
    $.fn.multi = function(settings) {
      settings = typeof settings !== "undefined" ? settings : {};

      return this.each(function() {
        var $select = $(this);

        multi($select.get(0), settings);
      });
    };
  })(jQuery);
}
