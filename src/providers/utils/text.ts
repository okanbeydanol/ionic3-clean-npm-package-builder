import { Injectable } from '@angular/core';

@Injectable()
export class CoreTextUtilsProvider {
  protected template = document.createElement('template'); // A template element to convert HTML to element.
  constructor() { }

  /**
* Escape an HTML text. This implementation is based on PHP's htmlspecialchars.
*
* @param text Text to escape.
* @param doubleEncode If false, it will not convert existing html entities. Defaults to true.
* @return Escaped text.
*/
  escapeHTML(text: string | number, doubleEncode: boolean = true): string {
    if (typeof text == 'undefined' || text === null || (typeof text == 'number' && isNaN(text))) {
      return '';
    } else if (typeof text != 'string') {
      return '' + text;
    }

    if (doubleEncode) {
      text = text.replace(/&/g, '&amp;');
    } else {
      text = text.replace(/&(?!amp;)(?!lt;)(?!gt;)(?!quot;)(?!#039;)/g, '&amp;');
    }

    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
 * Check if HTML content is blank.
 *
 * @param content HTML content.
 * @return True if the string does not contain actual content: text, images, etc.
 */
  htmlIsBlank(content: string): boolean {
    if (!content) {
      return true;
    }

    this.template.innerHTML = content;

    return this.template.content.textContent == '' && this.template.content.querySelector('img, object, hr') === null;
  }

  /**
 * Same as Javascript's JSON.parse, but it will handle errors.
 *
 * @param json JSON text.
 * @param defaultValue Default value t oreturn if the parse fails. Defaults to the original value.
 * @param logErrorFn An error to call with the exception to log the error. If not supplied, no error.
 * @return JSON parsed as object or what it gets.
 */
  parseJSON(json: string, defaultValue?: any, logErrorFn?: Function): any {
    try {
      return JSON.parse(json);
    } catch (ex) {
      // Error, log the error if needed.
      if (logErrorFn) {
        logErrorFn(ex);
      }
    }

    // Error parsing, return the default value or the original value.
    return typeof defaultValue != 'undefined' ? defaultValue : json;
  }

  /**
 * Make a string's first character uppercase.
 *
 * @param text Text to treat.
 * @return Treated text.
 */
  ucFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
 * Concatenate two paths, adding a slash between them if needed.
 *
 * @param leftPath Left path.
 * @param rightPath Right path.
 * @return Concatenated path.
 */
  concatenatePaths(leftPath: string, rightPath: string): string {
    if (!leftPath) {
      return rightPath;
    } else if (!rightPath) {
      return leftPath;
    }

    const lastCharLeft = leftPath.slice(-1),
      firstCharRight = rightPath.charAt(0);

    if (lastCharLeft === '/' && firstCharRight === '/') {
      return leftPath + rightPath.substr(1);
    } else if (lastCharLeft !== '/' && firstCharRight !== '/') {
      return leftPath + '/' + rightPath;
    } else {
      return leftPath + rightPath;
    }
  }


  /**
   * Replace all characters that cause problems with files in Android and iOS.
   *
   * @param text Text to treat.
   * @return Treated text.
   */
  removeSpecialCharactersForFiles(text: string): string {
    if (!text || typeof text != 'string') {
      return '';
    }

    return text.replace(/[#:\/\?\\]+/g, '_');
  }

  /**
 * Same as Javascript's decodeURIComponent, but if an exception is thrown it will return the original URI.
 *
 * @param uri URI to decode.
 * @return Decoded URI, or original URI if an exception is thrown.
 */
  decodeURIComponent(uri: string): string {
    try {
      return decodeURIComponent(uri);
    } catch (ex) {
      // Error, use the original URI.
    }

    return uri;
  }

  /**
 * If a number has only 1 digit, add a leading zero to it.
 *
 * @param num Number to convert.
 * @return Number with leading zeros.
 */
  twoDigits(num: string | number): string {
    if (num < 10) {
      return '0' + num;
    } else {
      return '' + num; // Convert to string for coherence.
    }
  }

  /**
 * Convert size in bytes into human readable format
 *
 * @param bytes Number of bytes to convert.
 * @param precision Number of digits after the decimal separator.
 * @return Size in human readable format.
 */
  bytesToSize(bytes: number, precision: number = 2): string {

    if (typeof bytes == 'undefined' || bytes === null || bytes < 0) {
      return 'error';
    }

    if (precision < 0) {
      precision = 2;
    }

    const keys = ['bayt', 'kilobayt', 'megabayt', 'gigabayt', 'terabayt'],
      units = keys;
    let pos = 0;

    if (bytes >= 1024) {
      while (bytes >= 1024) {
        pos++;
        bytes = bytes / 1024;
      }
      // Round to "precision" decimals if needed.
      bytes = Number(Math.round(parseFloat(bytes + 'e+' + precision)) + 'e-' + precision);
    }

    //return this.translate.instant('core.humanreadablesize', { size: bytes, unit: units[keys[pos]] });
  }
}
