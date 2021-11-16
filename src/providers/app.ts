import { ApplicationRef, Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Network } from '@ionic-native/Network';
import { Keyboard } from '@ionic-native/keyboard';

@Injectable()
export class CoreAppProvider {
  protected forceOffline = false;

  constructor(
    private platform: Platform,
    private keyboard: Keyboard,
    appRef: ApplicationRef,
    private network: Network
  ) {
    // Export the app provider and appRef to control the application in Behat tests.
    if (CoreAppProvider.isAutomated()) {
      (<any>window).appProvider = this;
      (<any>window).appRef = appRef;
    }
  }


  /**
 * Check if the browser supports mediaDevices.getUserMedia.
 *
 * @return Whether the function is supported.
 */
  canGetUserMedia(): boolean {
    return !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if the browser supports MediaRecorder.
   *
   * @return Whether the function is supported.
   */
  canRecordMedia(): boolean {
    return !!(<any>window).MediaRecorder;
  }

  /**
   * Closes the keyboard.
   */
  closeKeyboard(): void {
    if (this.isMobile()) {
      this.keyboard.hide();
    }
  }
  /**
 * Returns whether the user agent is controlled by automation. I.e. Behat testing.
 *
 * @return True if the user agent is controlled by automation, false otherwise.
 */
  static isAutomated(): boolean {
    return !!navigator.webdriver;
  }

  /**
   * Checks if the app is running in a 64 bits desktop environment (not browser).
   *
   * @return Whether the app is running in a 64 bits desktop environment (not browser).
   */
  is64Bits(): boolean {
    const process = (<any>window).process;

    return this.isDesktop() && process.arch == 'x64';
  }
  /**
 * Checks if the app is running in a desktop environment (not browser).
 *
 * @return Whether the app is running in a desktop environment (not browser).
 */
  isDesktop(): boolean {
    const process = (<any>window).process;

    return !!(process && process.versions && typeof process.versions.electron != 'undefined');
  }


  /**
   * Checks if the app is running in an iOS mobile or tablet device.
   *
   * @return Whether the app is running in an iOS mobile or tablet device.
   */
  isIOS(): boolean {
    return this.isMobile() && !this.platform.is('android');
  }

  /**
   * Checks if the app is running in an Android mobile or tablet device.
   *
   * @return Whether the app is running in an Android mobile or tablet device.
   */
  isAndroid(): boolean {
    return this.isMobile() && this.platform.is('android');
  }


  /**
   * Checks if the app is running in a mobile or tablet device (Cordova).
   *
   * @return Whether the app is running in a mobile or tablet device.
   */
  isMobile(): boolean {
    return this.platform.is('cordova');
  }


  /**
   * Open the keyboard.
   */
  openKeyboard(): void {
    // Open keyboard is not supported in desktop and in iOS.
    if (this.isAndroid()) {
      this.keyboard.show();
    }
  }




  /**
   * Checks if the current window is wider than a mobile.
   *
   * @return Whether the app the current window is wider than a mobile.
   */
  isWide(): boolean {
    return this.platform.width() > 768;
  }

  /**
   * Set value of forceOffline flag. If true, the app will think the device is offline.
   *
   * @param value Value to set.
   */
  setForceOffline(value: boolean): void {
    this.forceOffline = !!value;
  }

}
