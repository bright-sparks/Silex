/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview
 *   This class is used to manage Silex elements
 *   It has methods to manipulate the DOM elements
 *      created by new silex.model.Element().createElement
 */

goog.provide('silex.model.Element');

goog.require('goog.net.EventType');
goog.require('goog.net.ImageLoader');
goog.require('silex.types.Model');


/**
 * direction in the dom
 * @enum {string}
 */
silex.model.DomDirection = {
  UP: "UP",
  DOWN: "DOWN",
  TOP: "TOP",
  BOTTOM: "BOTTOM"
};


/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Element = function(model, view) {
  // store the model and the view
  /**
   * @type {silex.types.Model}
   */
  this.model = model;
  /**
   * @type {silex.types.View}
   */
  this.view = view;
};


/**
 * constant for minimum elements size
 * @const
 * @type {number}
 */
silex.model.Element.MIN_HEIGHT = 20;


/**
 * constant for minimum elements size
 * @const
 * @type {number}
 */
silex.model.Element.MIN_WIDTH = 20;


/**
 * constant for loader on elements
 * @const
 * @type {string}
 */
silex.model.Element.LOADING_ELEMENT_CSS_CLASS = 'loading-image';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_CONTAINER = 'container';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_IMAGE = 'image';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_TEXT = 'text';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_HTML = 'html';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_ATTR = 'data-silex-type';


/**
 * constant for the class name of the element content
 * @const
 * @type {string}
 */
silex.model.Element.ELEMENT_CONTENT_CLASS_NAME = 'silex-element-content';


/**
 * constant for the attribute name of the links
 * @const
 * @type {string}
 */
silex.model.Element.LINK_ATTR = 'data-silex-href';


/**
 * constant for the class name of selected components
 * @const
 * @type {string}
 */
silex.model.Element.SELECTED_CLASS_NAME = 'silex-selected';


/**
 * constant for the class name of pasted components
 * this will be removed from the component as soon as it is dragged
 * @const
 * @type {string}
 */
silex.model.Element.JUST_ADDED_CLASS_NAME = 'silex-just-added';


/**
 * prepare element for edition
 * @param  {string} rawHtml   raw HTML of the element to prepare
 * @return {string} the processed HTML
 */
silex.model.Element.prototype.prepareHtmlForEdit = function(rawHtml) {
  // prevent the user scripts from executing while editing
  rawHtml = rawHtml.replace(/<script.*class=\"silex-script\".*?>/gi, '<script type="text/notjavascript" class="silex-script">');
  // convert to absolute urls
  if (this.model.file.getUrl()) {
    rawHtml = silex.utils.Url.relative2Absolute(rawHtml, silex.utils.Url.getBaseUrl() + this.model.file.getUrl());
  }
  return rawHtml;
};



/**
 * unprepare element for edition
 * @param  {string} rawHtml   raw HTML of the element to prepare
 * @return {string} the processed HTML
 */
silex.model.Element.prototype.unprepareHtmlForEdit = function(rawHtml) {
  // put back the user script
  rawHtml = rawHtml.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
  // remove cache control used to refresh images after editing by pixlr
  rawHtml = silex.utils.Dom.removeCacheControl(rawHtml);
  if (this.model.file.getUrl()) {
    // convert to relative urls
    let baseUrl = silex.utils.Url.getBaseUrl();
    rawHtml = silex.utils.Url.absolute2Relative(rawHtml, baseUrl + this.model.file.getUrl());
    // put back the static scripts (protocol agnostic)
    let staticUrl = baseUrl.substr(baseUrl.indexOf('//')) + 'static/';
    rawHtml = rawHtml.replace(new RegExp('\.\./\.\./\.\./\.\./\.\./[\.\./]*static/', 'g'), staticUrl);
  }
  return rawHtml;
};


/**
 * get num tabs
 * example: getTabs(2) returns '        '
 * @param {number} num
 * @return {string}
 */
silex.model.Element.prototype.getTabs = function(num) {
  var tabs = '';
  for (var n = 0; n < num; n++) {
    tabs += '    ';
  }
  return tabs;
};


/**
 * get/set type of the element
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @return  {string|null}           the style of the element
 * example: for a container this will return "container"
 */
silex.model.Element.prototype.getType = function(element) {
  //return goog.style.getStyle(element, styleName);
  return element.getAttribute(silex.model.Element.TYPE_ATTR);
};


/**
 * get all the element's styles
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @param {?boolean=} opt_computed use window.getComputedStyle instead of the element's stylesheet
 * @return  {string}           the styles of the element
 */
silex.model.Element.prototype.getAllStyles = function(element, opt_computed) {
  var styleObject = this.model.property.getStyleObject(element, opt_computed);
  var styleStr = silex.utils.Style.styleToString(styleObject);
  return this.unprepareHtmlForEdit(styleStr);
};


/**
 * get/set style of the element
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @param  {string} styleName  the style name
 * @param {?boolean=} opt_computed use window.getComputedStyle instead of the element's stylesheet
 * @return  {string|null}           the style of the element
 */
silex.model.Element.prototype.getStyle = function(element, styleName, opt_computed) {
  var styleObject = this.model.property.getStyleObject(element, opt_computed);
  var cssName = goog.string.toSelectorCase(styleName);
  if (styleObject && styleObject[cssName]) {
    return this.unprepareHtmlForEdit(styleObject[cssName]);
  }
  return null;
};


/**
 * get/set style of element from a container created by silex
 * @param  {Element} element            created by silex, either a text box, image, ...
 * @param  {string}  styleName          the style name, camel case, not css with dashes
 * @param  {?string=}  opt_styleValue     the value for this styleName
 */
silex.model.Element.prototype.setStyle = function(element, styleName, opt_styleValue) {
  // convert to css case
  styleName = goog.string.toSelectorCase(styleName);
  // retrieve style
  var styleObject = this.model.property.getStyleObject(element);
  if (!styleObject) {
    styleObject = {};
  }
  if (styleObject[styleName] !== opt_styleValue) {
    if (goog.isDefAndNotNull(opt_styleValue)) {
      styleObject[styleName] = this.prepareHtmlForEdit(opt_styleValue);
    }
    else {
      styleObject[styleName] = '';
    }
    this.model.property.setStyle(element, styleObject);
  }
  // remove the 'just pasted' class
  element.classList.remove(silex.model.Element.JUST_ADDED_CLASS_NAME);
};


/**
 * get/set a property of an element from a container created by silex
 * @param  {Element} element            created by silex, either a text box, image, ...
 * @param  {string}  propertyName          the property name
 * @param  {?string=}  opt_propertyValue     the value for this propertyName
 * @param  {?boolean=}  opt_applyToContent    apply to the element or to its ".silex-element-content" element
 * example: element.setProperty(imgElement, 'style', 'top: 5px; left: 30px;')
 */
silex.model.Element.prototype.setProperty = function(element, propertyName, opt_propertyValue, opt_applyToContent) {
  if (opt_applyToContent) {
    element = this.getContentNode(element);
  }
  if (goog.isDefAndNotNull(opt_propertyValue)) {
    element.setAttribute(propertyName, /** @type {!string} */ (opt_propertyValue));
  }
  else {
    element.removeAttribute(propertyName);
  }
};


/**
 * @param {Element} element
 * @param {string} url    URL of the image chosen by the user
 */
silex.model.Element.prototype.setBgImage = function(element, url) {
  if (url) {
    this.setStyle(element, 'backgroundImage', silex.utils.Url.addUrlKeyword(url));
  }
  else {
    this.setStyle(element, 'backgroundImage');
  }
  // redraw tools
  this.model.body.setSelection(this.model.body.getSelection());
};


/**
 * get/set html from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @return  {string}  the html content
 */
silex.model.Element.prototype.getInnerHtml = function(element) {
  // disable editable
  this.model.body.setEditable(element, false);
  var innerHTML = this.getContentNode(element).innerHTML;
  // remove absolute urls and not executable scripts
  innerHTML = this.unprepareHtmlForEdit(innerHTML);
  // re-enable editable
  this.model.body.setEditable(element, true);
  return innerHTML;
};


/**
 * get/set element from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @param  {string} innerHTML the html content
 */
silex.model.Element.prototype.setInnerHtml = function(element, innerHTML) {
  // get the container of the html content of the element
  var contentNode = this.getContentNode(element);
  // cleanup
  this.model.body.setEditable(element, false);
  // remove absolute urls and not executable scripts
  innerHTML = this.prepareHtmlForEdit(innerHTML);
  // set html
  contentNode.innerHTML = innerHTML;
  // make editable again
  this.model.body.setEditable(element, true);
};


/**
 * get/set element from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @return  {Element}  the element which holds the content, i.e. a div, an image, ...
 */
silex.model.Element.prototype.getContentNode = function(element) {
  var content;
  // find the content elements
  var contentElements = goog.dom.getElementsByClass(
      silex.model.Element.ELEMENT_CONTENT_CLASS_NAME,
      element);
  if (contentElements && contentElements.length === 1) {
    // image or html box case
    content = contentElements[0];
  }
  else {
    // text box or container case
    content = element;
  }
  return content;
};


/**
 * move the element up/down the DOM
 * @param  {Element} element
 * @param  {silex.model.DomDirection} direction
 */
silex.model.Element.prototype.move = function(element, direction) {
  switch(direction) {
    case silex.model.DomDirection.UP:
      let sibling = this.getNextElement(element);
      if(sibling) {
        // insert after
        element.parentNode.insertBefore(sibling, element);
      }
      break;
    case silex.model.DomDirection.DOWN:
      let sibling = this.getPreviousElement(element);
      if(sibling) {
        // insert before
        element.parentNode.insertBefore(sibling, element.nextSibling);
      }
      break;
    case silex.model.DomDirection.TOP:
      element.parentNode.appendChild(element);
      break;
    case silex.model.DomDirection.BOTTOM:
      element.parentNode.insertBefore(element, element.parentNode.childNodes[0]);
      break;
  }
  // remove the 'just pasted' class
  element.classList.remove(silex.model.Element.JUST_ADDED_CLASS_NAME);
};


/**
 * get the previous element in the DOM, which is a Silex element
 * @param {Element} element
 * @return {Element|null}
 */
silex.model.Element.prototype.getPreviousElement = function(element) {
  let len = element.parentNode.childNodes.length;
  let res = null;
  for (let idx=0; idx < len; idx++) {
    let el = element.parentNode.childNodes[idx];
    if (el.nodeType === 1 && this.getType(el) !== null) {
      if(el === element) {
        return res;
      }
      // candidates are the elements which are visible in the current page, or visible everywhere (not paged)
      if(this.model.page.isInPage(el) || this.model.page.getPagesForElement(el).length === 0) {
        res = el;
      }
    }
  }
  return null;
};


/**
 * get the previous element in the DOM, which is a Silex element
 * @param {Element} element
 * @return {Element|null}
 */
silex.model.Element.prototype.getNextElement = function(element) {
  let len = element.parentNode.childNodes.length;
  let res = null;
  for (let idx=len - 1; idx >= 0; idx--) {
    let el = element.parentNode.childNodes[idx];
    if (el.nodeType === 1 && this.getType(el) !== null) {
      if(el === element) {
        return res;
      }
      // candidates are the elements which are visible in the current page, or visible everywhere (not paged)
      if(this.model.page.isInPage(el) || this.model.page.getPagesForElement(el).length === 0) {
        res = el;
      }
    }
  }
  return null;
};


/**
 * set/get the image URL of an image element
 * @param  {Element} element  container created by silex which contains an image
 * @return  {string}  the url of the image
 */
silex.model.Element.prototype.getImageUrl = function(element) {
  var url = '';
  if (element.getAttribute(silex.model.Element.TYPE_ATTR) === silex.model.Element.TYPE_IMAGE) {
    // get the image tag
    let img = this.getContentNode(element);
    if (img) {
      url = img.getAttribute('src');
    }
    else {
      console.error('The image could not be retrieved from the element.', element);
    }
  }
  else {
    console.error('The element is not an image.', element);
  }
  return url;
};


/**
 * set/get the image URL of an image element
 * @param  {Element} element  container created by silex which contains an image
 * @param  {string} url  the url of the image
 * @param  {?function(Element, Element)=} opt_callback the callback to be notified when the image is loaded
 * @param  {?function(Element, string)=} opt_errorCallback the callback to be notified of errors
 */
silex.model.Element.prototype.setImageUrl = function(element, url, opt_callback, opt_errorCallback) {
  if (element.getAttribute(silex.model.Element.TYPE_ATTR) === silex.model.Element.TYPE_IMAGE) {
    // get the image tag
    let img = this.getContentNode(element);
    if (img) {
      //img.innerHTML = '';
      // listen to the complete event
      var imageLoader = new goog.net.ImageLoader();
      goog.events.listenOnce(imageLoader, goog.events.EventType.LOAD,
          function(e) {
            // handle the loaded image
            img = e.target;
            // callback
            if (opt_callback) {
              opt_callback(element, img);
            }
            // add the image to the element
            goog.dom.appendChild(element, img);
            // add a marker to find the inner content afterwards, with getContent
            goog.dom.classlist.add(img, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
            // remove the id set by the loader (it needs it to know what has already been loaded?)
            img.removeAttribute('id');
            // remove loading asset
            goog.dom.classlist.remove(element, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
            // redraw tools
            this.model.body.setSelection(this.model.body.getSelection());
          }, true, this);
      goog.events.listenOnce(imageLoader, goog.net.EventType.ERROR,
          function() {
            console.error('An error occured while loading the image.', element);
            // callback
            if (opt_errorCallback) {
              opt_errorCallback(element, 'An error occured while loading the image.');
            }
          }, true, this);
      // add loading asset
      goog.dom.classlist.add(element, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
      // remove previous img tag
      var imgTags = goog.dom.getElementsByTagNameAndClass('img', silex.model.Element.ELEMENT_CONTENT_CLASS_NAME, element);
      if (imgTags.length > 0) {
        goog.dom.removeNode(imgTags[0]);
      }
      // load the image
      imageLoader.addImage(url, url);
      imageLoader.start();
    }
    else {
      console.error('The image could not be retrieved from the element.', element);
      if (opt_errorCallback) {
        opt_errorCallback(element, 'The image could not be retrieved from the element.');
      }
    }
  }
  else {
    console.error('The element is not an image.', element);
    if (opt_errorCallback) {
      opt_errorCallback(element, 'The element is not an image.');
    }
  }
};


/**
 * remove a DOM element
 * @param  {Element} element   the element to remove
 */
silex.model.Element.prototype.removeElement = function(element) {
  // check this is allowed, i.e. an element inside the stage container
  if (this.model.body.getBodyElement() !== element &&
      goog.dom.contains(this.model.body.getBodyElement(), element)) {
    // useless? Should remove its style? this.model.property.setStyle(element);
    // remove the element
    goog.dom.removeNode(element);
  }
  else {
    console.error('could not delete', element, 'because it is not in the stage element');
  }
};


/**
 * append an element to the stage
 * handles undo/redo
 * @param {Element} container
 * @param {Element} element
 */
silex.model.Element.prototype.addElement = function(container, element) {
  goog.dom.appendChild(container, element);
  // add the class to keep the element above all others
  element.classList.add(silex.model.Element.JUST_ADDED_CLASS_NAME);
 };


/**
 * element creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 * @param  {string} type  the type of the element to create,
 *    see TYPE_* constants of the class @see silex.model.Element
 * @return  {Element}   the newly created element
 */
silex.model.Element.prototype.createElement = function(type) {
  // find the container (main background container or the stage)
  var bodyElement = this.model.body.getBodyElement();
  var container = goog.dom.getElementByClass(silex.view.Stage.BACKGROUND_CLASS_NAME, bodyElement);
  if (!container) {
    container = bodyElement;
  }
  // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
  var offsetX = 100 + this.view.stage.getScrollX();
  var offsetY = 100 + this.view.stage.getScrollY();
  // default style
  var styleObject = {
    height: '100px',
    width: '100px',
    top: offsetY + 'px',
    left: offsetX + 'px'
  };

  // create the element
  var element = null;
  switch (type) {

    // container
    case silex.model.Element.TYPE_CONTAINER:
      element = this.createContainerElement();
      // add a default style
      styleObject.backgroundColor = '#FFFFFF';
      break;

    // text
    case silex.model.Element.TYPE_TEXT:
      element = this.createTextElement();
      break;

    // HTML box
    case silex.model.Element.TYPE_HTML:
      element = this.createHtmlElement();
      // add a default style
      styleObject.backgroundColor = '#FFFFFF';
      break;

    // Image
    case silex.model.Element.TYPE_IMAGE:
      element = this.createImageElement();
      break;

  }

  // init the element
  goog.dom.classlist.add(element, silex.model.Body.EDITABLE_CLASS_NAME);
  this.model.property.initSilexId(element, this.model.file.getContentDocument());

  // apply the style
  this.model.property.setStyle(element, styleObject);

  // make it editable
  this.model.body.setEditable(element, true);

  // add css class for Silex styles
  goog.dom.classlist.add(element, type + '-element');
  // add to stage
  this.addElement(container, element);
  // return the element
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createContainerElement = function() {
  // create the conatiner
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_CONTAINER);
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createTextElement = function() {
  // create the element
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_TEXT);
  // create the container for text content
  var textContent = goog.dom.createElement('div');
  // add empty content
  textContent.innerHTML = 'New text box';
  goog.dom.appendChild(element, textContent);
  // add a marker to find the inner content afterwards, with getContent
  goog.dom.classlist.add(textContent, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
  // add normal class for default text formatting
  // sometimes there is only in text node in textContent
  // e.g. whe select all + remove formatting
  goog.dom.classlist.add(textContent, 'normal');

  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createHtmlElement = function() {
  // create the element
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_HTML);
  // create the container for html content
  var htmlContent = goog.dom.createElement('div');
  htmlContent.innerHTML = '<p>New HTML box</p>';
  goog.dom.appendChild(element, htmlContent);
  // add a marker to find the inner content afterwards, with getContent
  goog.dom.classlist.add(htmlContent, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);

  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createImageElement = function() {
  // create the element
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_IMAGE);
  return element;
};


/**
 * set/get a "silex style link" on an element
 * @param  {Element} element
 * @param  {?string=} opt_link  a link (absolute or relative)
 *         or an internal link (beginning with #!)
 *         or null to remove the link
 */
silex.model.Element.prototype.setLink = function(element, opt_link) {
  if (opt_link) {
    element.setAttribute(silex.model.Element.LINK_ATTR, opt_link);
  }
  else {
    element.removeAttribute(silex.model.Element.LINK_ATTR);
  }
};


/**
 * set/get a "silex style link" on an element
 * @param  {Element} element
 * @return {string}
 */
silex.model.Element.prototype.getLink = function(element) {
  return element.getAttribute(silex.model.Element.LINK_ATTR);
};


/**
 * get/set class name of the element of a container created by silex
 * remove all silex internal classes
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @return  {?string}           the value for this styleName
 */
silex.model.Element.prototype.getClassName = function(element) {
  var pages = this.model.page.getPages();
  return goog.array.map(element.className.split(' '), function(name) {
    if (goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name) ||
        goog.array.contains(pages, name) ||
        this.model.property.getSilexId(element) === name) {
      return;
    }
    return name;
  }, this).join(' ').trim();
};


/**
 * get/set class name of the element of a container created by silex
 * remove all silex internal classes
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @param  {string=} opt_className  the class names, or null to reset
 */
silex.model.Element.prototype.setClassName = function(element, opt_className) {
  // compute class names to keep, no matter what
  // i.e. the one which are in element.className + in Silex internal classes
  var pages = this.model.page.getPages();
  var classNamesToKeep = goog.array.map(element.className.split(' '), function(name) {
    if (goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name) ||
        goog.array.contains(pages, name) ||
        this.model.property.getSilexId(element) === name) {
      return name;
    }
  }, this);

  // reset element class name
  element.className = classNamesToKeep.join(' ');
  if (opt_className) {
    // apply classes from opt_className
    goog.array.forEach(opt_className.split(' '), function(name) {
      name = name.trim();
      if (name && name !== '') {
        goog.dom.classlist.add(element, name);
      }
    });
  }
};
