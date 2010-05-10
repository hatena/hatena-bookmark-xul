const EXPORT = ['Star'];

let E = createElementBindDocument(document, XHTML_NS);
let strings = new Strings('chrome://hatenabookmark/locale/star.properties');

var Star = {
    BASE_URI: 'http://s.hatena.ne.jp/',

    COLOR_YELLOW: 'yellow',
    COLOR_GREEN:  'green',
    COLOR_RED:    'red',
    COLOR_BLUE:   'blue',
    COLOR_PURPLE: 'purple',

    EVENT_STAR_ACTIVATED:             'HB.StarActivated',
    EVENT_STAR_INNER_COUNT_ACTIVATED: 'HB.StarInnerCountActivated',

    OPEN_QUOTE: strings.get('openQuote'),
    CLOSE_QUOTE: strings.get('closeQuote'),

    classes: {
        CONTAINER:           'hBookmark-star-container',
        STAR:                'hBookmark-star',
        INNER_COUNT:         'hBookmark-star-inner-count',
        ADD_BUTTON:          'hBookmark-star-add-button',
        HIGHLIGHT:           'hBookmark-star-highlight',
        HIGHLIGHT_CONTAINER: 'hBookmark-star-highlight-container',
    },

    rks: '',
    baseElements: null,
    strings: strings,

    init: function Star_init(settings) {
        let elements = {};
        let classes = Star.classes;
        for (let [color, setting] in new Iterator(settings.stars)) {
            let star = E('img', { src: setting.src, alt: setting.alt });
            if (color !== 'temp')
                star = E('a', { class: classes.STAR + ' ' + color }, star);
            elements[color] = star;
        }
        elements.addButton = E('img', { src: settings.addButton.src,
                                        alt: settings.addButton.alt,
                                        class: classes.ADD_BUTTON,
                                        tabindex: 0 });
        Star.baseElements = elements;
    },

    get canModify() !!(User.user && Star.rks),

    get tooltip() {
        let tooltip = {
            body:  document.getElementById('hBookmark-star-tooltip'),
            icon:  document.getElementById('hBookmark-star-tooltip-icon'),
            user:  document.getElementById('hBookmark-star-tooltip-user'),
            quote: document.getElementById('hBookmark-star-tooltip-quote'),
        };
        tooltip.body.addEventListener('popuphidden', Star.hideTooltip, false);
        delete Star.tooltip;
        return Star.tooltip = tooltip;
    },

    createStar: function Star_createStar(user, quote, color, highlight) {
        var star = Star.baseElements[color].cloneNode(true);
        star.href = UserUtils.getHomepage(user, 'b');
        star.user = user;
        star.quote = quote;
        star.highlight = highlight;
        return star;
    },

    createTemporaryStar: function Star_createTemoporaryStar() {
        return Star.baseElements['temp'].cloneNode(true);
    },

    createStarsForEntry: function Star_createStarsForEntry(entry, highlight,
                                                           withAddButton,
                                                           title, location) {
        if (typeof withAddButton === 'undefined' || withAddButton === null)
            withAddButton = Star.canModify;
        let starsList = [];
        if (entry.colored_stars)
            starsList = entry.colored_stars.concat();
        if (entry.stars)
            starsList.push({ color: 'yellow', stars: entry.stars });
        let classes = Star.classes;
        let container = E('span', { class: classes.CONTAINER });
        starsList.forEach(function (stars) {
            let color = stars.color;
            stars.stars.forEach(function (star) {
                if (typeof star === 'number') {
                    let span = E('span',
                                 { class: classes.INNER_COUNT + ' ' + color,
                                   tabindex: 0 },
                                 star);
                    span.targetURI = entry.uri;
                    container.appendChild(span);
                } else {
                    let elem = Star.createStar(star.name, star.quote, color, highlight);
                    if (star.count && star.count > 1) {
                        elem.appendChild(document.createTextNode(star.count));
                        elem.className += ' with-count';
                    }
                    container.appendChild(elem);
                }
            });
        });
        if (withAddButton) {
            container.insertBefore(Star.createAddButton(entry.uri, title, location),
                                   container.firstChild);
        }
        return container;
    },

    createPlaceholder: function Star_createPlaceholder(uri, title, location) {
        return E('span', { class: Star.classes.CONTAINER },
                 Star.createAddButton(uri, title, location));
    },

    createAddButton: function Star_createAddButton(uri, title, location) {
        let element = Star.baseElements['addButton'].cloneNode(true);
        let button = new Star.AddButton(uri, title, location);
        element.button = button;
        return element;
    },

    childTextExpression: document.createExpression('*/text()', null),

    createHighlightedContainer: function Star_createHighlightedContainer(base, keyword) {
        let container = base.cloneNode(true);
        let texts = Star.childTextExpression.evaluate(container,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < texts.snapshotLength; i++) {
            let text = texts.snapshotItem(i);
            while (text) {
                let start = text.data.indexOf(keyword);
                if (start === -1) break;
                let keywordText = text.splitText(start);
                let restText = keywordText.splitText(keyword.length);
                let em = E('em', { class: Star.classes.HIGHLIGHT });
                text.parentNode.replaceChild(em, keywordText);
                em.appendChild(keywordText);
                text = restText;
            }
        }
        return container;
    },

    onClick: function Star_onClick(event) {
        if (event.button === 2) return; // Do nothing with right click.
        let newEventType = null;
        let target = event.target;
        let classes = Star.classes;
        if (target instanceof Ci.nsIDOMHTMLImageElement) {
            if (target.className === classes.ADD_BUTTON) {
                target.button.addStar(target);
                event.stopPropagation();
                return;
            } else {
                target = target.parentNode;
            }
        }
        if (!newEventType) {
            if (target.className.indexOf(classes.STAR + ' ') === 0)
                newEventType = Star.EVENT_STAR_ACTIVATED;
            else if (target.className.indexOf(classes.INNER_COUNT + ' ') === 0)
                newEventType = Star.EVENT_STAR_INNER_COUNT_ACTIVATED;
        }
        if (newEventType) {
            event.stopPropagation();
            event.preventDefault();
            let newEvent = document.createEvent('Event');
            newEvent.initEvent(newEventType, true, false);
            target.dispatchEvent(newEvent);
        }
    },

    currentStar: null,

    onMouseOver: function Star_onMouseOver(event) {
        let target = event.target;
        let classes = Star.classes;
        if (target instanceof Ci.nsIDOMHTMLImageElement) {
            if (target.className === classes.ADD_BUTTON) {
                target.button.showPaletteLater(target);
                return;
            } else if (target.parentNode === event.relatedTarget) {
                return;
            }
            target = target.parentNode;
        }
        if (target.className.indexOf(classes.STAR + ' ') !== 0 ||
            !target.user || target.firstChild === event.relatedTarget)
            return;
        Star.showTooltip(target);
    },

    onMouseOut: function Star_onMouseOut(event) {
        if (event.target.className === Star.classes.ADD_BUTTON)
            event.target.button.cancelPalette();
        let star = Star.currentStar;
        let dest = event.relatedTarget;
        if (!star || Star.isInTooltip(dest) ||
            (dest && (dest === star || dest.parentNode === star)))
            return;
        Star.tooltip.body.hidePopup();
    },

    showTooltip: function Star_showTooltip(star) {
        let tooltip = Star.tooltip;
        tooltip.icon.src = UserUtils.getProfileIcon(star.user);
        tooltip.user.value = star.user;
        if (star.quote) {
            tooltip.quote.textContent =
                Star.OPEN_QUOTE + star.quote + Star.CLOSE_QUOTE;
            tooltip.quote.collapsed = false;
            if (star.highlight) {
                let parent = star.parentNode.parentNode;
                if (!star.originalContainer) {
                    star.originalContainer =
                        parent.getElementsByClassName(Star.classes.HIGHLIGHT_CONTAINER).item(0);
                    star.highlightedContainer =
                        Star.createHighlightedContainer(star.originalContainer, star.quote);
                }
                parent.replaceChild(star.highlightedContainer,
                                    star.originalContainer);
            }
        } else {
            tooltip.quote.collapsed = true;
        }
        tooltip.body.openPopup(star, 'after_start', 0, 0, false, false);
        Star.currentStar = star;
    },

    hideTooltip: function Star_hideTooltip() {
        let star = Star.currentStar;
        Star.currentStar = null;
        if (star.highlightedContainer &&
            star.highlightedContainer.parentNode) {
            star.highlightedContainer.parentNode.replaceChild(
                star.originalContainer, star.highlightedContainer);
        }
    },

    isInTooltip: function Star_isInTooltip(element) {
        let tooltip = Star.tooltip.body;
        for (let i = 0; element && i++< 3; element = element.parentNode)
            if (element === tooltip)
                return true;
        return false;
    },
};

let imageBase = 'chrome://hatenabookmark/skin/images/';
Star.DEFAULT_SETTINGS = {
    stars: {
        yellow: {
            src: imageBase + 'star.gif',
            alt: strings.get('starChar'),
        },
        green: {
            src: imageBase + 'star-green.gif',
            alt: strings.get('coloredStarChar'),
        },
        red: {
            src: imageBase + 'star-red.gif',
            alt: strings.get('coloredStarChar'),
        },
        blue: {
            src: imageBase + 'star-blue.gif',
            alt: strings.get('coloredStarChar'),
        },
        purple: {
            src: imageBase + 'star-purple.gif',
            alt: strings.get('coloredStarChar'),
        },
        temp: {
            src: imageBase + 'star-temp.gif',
            alt: strings.get('starChar'),
        },
    },
    addButton: {
        src: imageBase + 'star-add-button.gif',
        alt: strings.get('addButtonLabel'),
    },
};

Star.init(Star.DEFAULT_SETTINGS);
