import { Injectable } from '@angular/core';
import { Toast, ToastController } from 'ionic-angular';
import { Content } from 'ionic-angular';
import { CoreAppProvider } from './../app';

@Injectable()
export class CoreDomUtilsProvider {
  // List of input types that support keyboard.
  protected INPUT_SUPPORT_KEYBOARD = ['date', 'datetime', 'datetime-local', 'email', 'month', 'number', 'password',
    'search', 'tel', 'text', 'time', 'url', 'week'];
  protected template = document.createElement('template'); // A template element to convert HTML to element.
  constructor(
    private coreApp: CoreAppProvider,
    private toastCtrl: ToastController
  ) { }


  /**
 * Convert some HTML as text into an HTMLElement. This HTML is put inside a div or a body.
 *
 * @param html Text to convert.
 * @return Element.
 */
  convertToElement(html: string): HTMLElement {
    // Add a div to hold the content, that's the element that will be returned.
    this.template.innerHTML = '<div>' + html + '</div>';

    return <HTMLElement>this.template.content.children[0];
  }

  /**
   * Focus an element and open keyboard.
   *
   * @param el HTML element to focus.
   */
  focusElement(el: HTMLElement): void {
    if (el && el.focus) {
      el.focus();
      if (this.coreApp.isAndroid() && this.supportsInputKeyboard(el)) {
        // On some Android versions the keyboard doesn't open automatically.
        this.coreApp.openKeyboard();
      }
    }
  }

  /**
   * Check if an element supports input via keyboard.
   *
   * @param el HTML element to check.
   * @return Whether it supports input using keyboard.
   */
  supportsInputKeyboard(el: any): boolean {
    return el && !el.disabled && (el.tagName.toLowerCase() == 'textarea' ||
      (el.tagName.toLowerCase() == 'input' && this.INPUT_SUPPORT_KEYBOARD.indexOf(el.type) != -1));
  }
  /**
   * Returns the contents of a certain selection in a DOM element.
   *
   * @param element DOM element to search in.
   * @param selector Selector to search.
   * @return Selection contents. Undefined if not found.
   */
  getContentsOfElement(element: HTMLElement, selector: string): string {
    if (element) {
      const selected = element.querySelector(selector);
      if (selected) {
        return selected.innerHTML;
      }
    }
  }

  /**
   * Get the data from a form. It will only collect elements that have a name.
   *
   * @param form The form to get the data from.
   * @return Object with the data. The keys are the names of the inputs.
   */
  getDataFromForm(form: HTMLFormElement): any {
    if (!form || !form.elements) {
      return {};
    }

    const data = {};

    for (let i = 0; i < form.elements.length; i++) {
      const element: any = form.elements[i],
        name = element.name || '';

      // Ignore submit inputs.
      if (!name || element.type == 'submit' || element.tagName == 'BUTTON') {
        continue;
      }

      // Get the value.
      if (element.type == 'checkbox') {
        data[name] = !!element.checked;
      } else if (element.type == 'radio') {
        if (element.checked) {
          data[name] = element.value;
        }
      } else {
        data[name] = element.value;
      }
    }

    return data;
  }

  /**
   * Returns the attribute value of a string element. Only the first element will be selected.
   *
   * @param html HTML element in string.
   * @param attribute Attribute to get.
   * @return Attribute value.
   */
  getHTMLElementAttribute(html: string, attribute: string): string {
    return this.convertToElement(html).children[0].getAttribute('src');
  }

  /**
   * Returns height of an element.
   *
   * @param element DOM element to measure.
   * @param usePadding Whether to use padding to calculate the measure.
   * @param useMargin Whether to use margin to calculate the measure.
   * @param useBorder Whether to use borders to calculate the measure.
   * @param innerMeasure If inner measure is needed: padding, margin or borders will be substracted.
   * @return Height in pixels.
   */
  getElementHeight(element: any, usePadding?: boolean, useMargin?: boolean, useBorder?: boolean,
    innerMeasure?: boolean): number {
    return this.getElementMeasure(element, false, usePadding, useMargin, useBorder, innerMeasure);
  }

  /**
   * Returns height or width of an element.
   *
   * @param element DOM element to measure.
   * @param getWidth Whether to get width or height.
   * @param usePadding Whether to use padding to calculate the measure.
   * @param useMargin Whether to use margin to calculate the measure.
   * @param useBorder Whether to use borders to calculate the measure.
   * @param innerMeasure If inner measure is needed: padding, margin or borders will be substracted.
   * @return Measure in pixels.
   */
  getElementMeasure(element: any, getWidth?: boolean, usePadding?: boolean, useMargin?: boolean, useBorder?: boolean,
    innerMeasure?: boolean): number {

    const offsetMeasure = getWidth ? 'offsetWidth' : 'offsetHeight',
      measureName = getWidth ? 'width' : 'height',
      clientMeasure = getWidth ? 'clientWidth' : 'clientHeight',
      priorSide = getWidth ? 'Left' : 'Top',
      afterSide = getWidth ? 'Right' : 'Bottom';
    let measure = element[offsetMeasure] || element[measureName] || element[clientMeasure] || 0;

    // Measure not correctly taken.
    if (measure <= 0) {
      const style = getComputedStyle(element);
      if (style && style.display == '') {
        element.style.display = 'inline-block';
        measure = element[offsetMeasure] || element[measureName] || element[clientMeasure] || 0;
        element.style.display = '';
      }
    }

    if (usePadding || useMargin || useBorder) {
      const computedStyle = getComputedStyle(element);
      let surround = 0;

      if (usePadding) {
        surround += this.getComputedStyleMeasure(computedStyle, 'padding' + priorSide) +
          this.getComputedStyleMeasure(computedStyle, 'padding' + afterSide);
      }
      if (useMargin) {
        surround += this.getComputedStyleMeasure(computedStyle, 'margin' + priorSide) +
          this.getComputedStyleMeasure(computedStyle, 'margin' + afterSide);
      }
      if (useBorder) {
        surround += this.getComputedStyleMeasure(computedStyle, 'border' + priorSide + 'Width') +
          this.getComputedStyleMeasure(computedStyle, 'border' + afterSide + 'Width');
      }
      if (innerMeasure) {
        measure = measure > surround ? measure - surround : 0;
      } else {
        measure += surround;
      }
    }

    return measure;
  }

  /**
   * Returns the computed style measure or 0 if not found or NaN.
   *
   * @param style Style from getComputedStyle.
   * @param measure Measure to get.
   * @return Result of the measure.
   */
  getComputedStyleMeasure(style: any, measure: string): number {
    return parseInt(style[measure], 10) || 0;
  }
  /**
  * Returns width of an element.
  *
  * @param element DOM element to measure.
  * @param usePadding Whether to use padding to calculate the measure.
  * @param useMargin Whether to use margin to calculate the measure.
  * @param useBorder Whether to use borders to calculate the measure.
  * @param innerMeasure If inner measure is needed: padding, margin or borders will be substracted.
  * @return Width in pixels.
  */
  getElementWidth(element: any, usePadding?: boolean, useMargin?: boolean, useBorder?: boolean,
    innerMeasure?: boolean): number {
    return this.getElementMeasure(element, true, usePadding, useMargin, useBorder, innerMeasure);
  }

  /**
   * Retrieve the position of a element relative to another element.
   *
   * @param container Element to search in.
   * @param selector Selector to find the element to gets the position.
   * @param positionParentClass Parent Class where to stop calculating the position. Default scroll-content.
   * @return positionLeft, positionTop of the element relative to.
   */
  getElementXY(container: HTMLElement, selector?: string, positionParentClass?: string): number[] {
    let element: HTMLElement = <HTMLElement>(selector ? container.querySelector(selector) : container),
      offsetElement,
      positionTop = 0,
      positionLeft = 0;

    if (!positionParentClass) {
      positionParentClass = 'scroll-content';
    }

    if (!element) {
      return null;
    }

    while (element) {
      positionLeft += (element.offsetLeft - element.scrollLeft + element.clientLeft);
      positionTop += (element.offsetTop - element.scrollTop + element.clientTop);

      offsetElement = element.offsetParent;
      element = element.parentElement;

      // Every parent class has to be checked but the position has to be got form offsetParent.
      while (offsetElement != element && element) {
        // If positionParentClass element is reached, stop adding tops.
        if (element.className.indexOf(positionParentClass) != -1) {
          element = null;
        } else {
          element = element.parentElement;
        }
      }

      // Finally, check again.
      if (element && element.className.indexOf(positionParentClass) != -1) {
        element = null;
      }
    }

    return [positionLeft, positionTop];
  }

  /**
   * Wait an element to exists using the findFunction.
   *
   * @param findFunction The function used to find the element.
   * @return Resolved if found, rejected if too many tries.
   */
  waitElementToExist(findFunction: Function): Promise<HTMLElement> {
    const promiseInterval = {
      promise: null,
      resolve: null,
      reject: null
    };

    let tries = 100;

    promiseInterval.promise = new Promise((resolve, reject): void => {
      promiseInterval.resolve = resolve;
      promiseInterval.reject = reject;
    });

    const clear = setInterval(() => {
      const element: HTMLElement = findFunction();

      if (element) {
        clearInterval(clear);
        promiseInterval.resolve(element);
      } else {
        tries--;

        if (tries <= 0) {
          clearInterval(clear);
          promiseInterval.reject();
        }
      }
    }, 100);

    return promiseInterval.promise;
  }

  /**
 * Check if an element is outside of screen (viewport).
 *
 * @param scrollEl The element that must be scrolled.
 * @param element DOM element to check.
 * @return Whether the element is outside of the viewport.
 */
  isElementOutsideOfScreen(scrollEl: HTMLElement, element: HTMLElement): boolean {
    const elementRect = element.getBoundingClientRect();
    let elementMidPoint,
      scrollElRect,
      scrollTopPos = 0;

    if (!elementRect) {
      return false;
    }

    elementMidPoint = Math.round((elementRect.bottom + elementRect.top) / 2);

    scrollElRect = scrollEl.getBoundingClientRect();
    scrollTopPos = (scrollElRect && scrollElRect.top) || 0;

    return elementMidPoint > window.innerHeight || elementMidPoint < scrollTopPos;
  }

  /**
 * Scroll to somehere in the content.
 * Checks hidden property _scroll to avoid errors if view is not active.
 *
 * @param content Content where to execute the function.
 * @param x The x-value to scroll to.
 * @param y The y-value to scroll to.
 * @param duration Duration of the scroll animation in milliseconds. Defaults to `300`.
 * @return Returns a promise which is resolved when the scroll has completed.
 */
  scrollTo(content: Content, x: number, y: number, duration?: number, done?: Function): Promise<any> {
    return content && content._scroll && content.scrollTo(x, y, duration, done);
  }

  /**
   * Scroll to Bottom of the content.
   * Checks hidden property _scroll to avoid errors if view is not active.
   *
   * @param content Content where to execute the function.
   * @param duration Duration of the scroll animation in milliseconds. Defaults to `300`.
   * @return Returns a promise which is resolved when the scroll has completed.
   */
  scrollToBottom(content: Content, duration?: number): Promise<any> {
    return content && content._scroll && content.scrollToBottom(duration);
  }

  /**
   * Scroll to Top of the content.
   * Checks hidden property _scroll to avoid errors if view is not active.
   *
   * @param content Content where to execute the function.
   * @param duration Duration of the scroll animation in milliseconds. Defaults to `300`.
   * @return Returns a promise which is resolved when the scroll has completed.
   */
  scrollToTop(content: Content, duration?: number): Promise<any> {
    return content && content._scroll && content.scrollToTop(duration);
  }

  /**
   * Returns contentHeight of the content.
   * Checks hidden property _scroll to avoid errors if view is not active.
   *
   * @param content Content where to execute the function.
   * @return Content contentHeight or 0.
   */
  getContentHeight(content: Content): number {
    return (content && content._scroll && content.contentHeight) || 0;
  }

  /**
   * Returns scrollHeight of the content.
   * Checks hidden property _scroll to avoid errors if view is not active.
   *
   * @param content Content where to execute the function.
   * @return Content scrollHeight or 0.
   */
  getScrollHeight(content: Content): number {
    return (content && content._scroll && content.scrollHeight) || 0;
  }

  /**
   * Returns scrollTop of the content.
   * Checks hidden property _scrollContent to avoid errors if view is not active.
   * Using navite value of scroll to avoid having non updated values.
   *
   * @param content Content where to execute the function.
   * @return Content scrollTop or 0.
   */
  getScrollTop(content: Content): number {
    return (content && content._scrollContent && content._scrollContent.nativeElement.scrollTop) || 0;
  }

  /**
   * Scroll to a certain element.
   *
   * @param content The content that must be scrolled.
   * @param element The element to scroll to.
   * @param scrollParentClass Parent class where to stop calculating the position. Default scroll-content.
   * @return True if the element is found, false otherwise.
   */
  scrollToElement(content: Content, element: HTMLElement, scrollParentClass?: string): boolean {
    const position = this.getElementXY(element, undefined, scrollParentClass);
    if (!position) {
      return false;
    }

    this.scrollTo(content, position[0], position[1]);

    return true;
  }

  /**
   * Scroll to a certain element using a selector to find it.
   *
   * @param content The content that must be scrolled.
   * @param selector Selector to find the element to scroll to.
   * @param scrollParentClass Parent class where to stop calculating the position. Default scroll-content.
   * @return True if the element is found, false otherwise.
   */
  scrollToElementBySelector(content: Content, selector: string, scrollParentClass?: string): boolean {
    const position = this.getElementXY(content.getScrollElement(), selector, scrollParentClass);
    if (!position) {
      return false;
    }

    this.scrollTo(content, position[0], position[1]);

    return true;
  }

  showToast(text: string, duration: number = 2000, cssClass: string = '',
    dismissOnPageChange: boolean = true): Toast {


    const loader = this.toastCtrl.create({
      message: text,
      duration: duration,
      position: 'bottom',
      cssClass: cssClass,
      dismissOnPageChange: dismissOnPageChange
    });

    loader.present();

    return loader;
  }
}
