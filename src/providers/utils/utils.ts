import { Injectable, NgZone } from '@angular/core';
import { Clipboard } from '@ionic-native/clipboard';
import { InAppBrowser, InAppBrowserObject } from '@ionic-native/in-app-browser';
import { CoreDomUtilsProvider } from './dom';
import { CoreAppProvider } from '../app';
import { CoreEventsProvider } from '../events';
@Injectable()
export class CoreUtilsProvider {
    protected iabInstance: InAppBrowserObject;
    constructor(
        protected clipboard: Clipboard,
        private domUtils: CoreDomUtilsProvider,
        private iab: InAppBrowser,
        private coreApp: CoreAppProvider,
        protected zone: NgZone,
        private eventsProvider: CoreEventsProvider
    ) { }

    /**
     * Similar to Promise.all, but if a promise fails this function's promise won't be rejected until ALL promises have finished.
     *
     * @param promises Promises.
     * @return Promise resolved if all promises are resolved and rejected if at least 1 promise fails.
     */
    allPromises(promises: Promise<any>[], context?: any): Promise<any> {
        if (!promises || !promises.length) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject): void => {
            const total = promises.length;
            let count = 0,
                hasFailed = false,
                error;

            promises.forEach((promise) => {
                promise.catch((err) => {
                    hasFailed = true;
                    error = err;
                }).then(() => {
                    count++;

                    if (count === total) {
                        // All promises have finished, reject/resolve.
                        if (hasFailed) {
                            reject(error);
                        } else {
                            resolve(true);
                        }
                    }
                });
            });
        });
    }


    /**
     * Converts an array of objects to an object, using a property of each entry as the key.
     * It can also be used to convert an array of strings to an object where the keys are the elements of the array.
     * E.g. [{id: 10, name: 'A'}, {id: 11, name: 'B'}] => {10: {id: 10, name: 'A'}, 11: {id: 11, name: 'B'}}
     *
     * @param array The array to convert.
     * @param propertyName The name of the property to use as the key. If not provided, the whole item will be used.
     * @param result Object where to put the properties. If not defined, a new object will be created.
     * @return The object.
     */
    arrayToObject(array: any[], propertyName?: string, result?: any): any {
        result = result || {};
        array.forEach((entry) => {
            const key = propertyName ? entry[propertyName] : entry;
            result[key] = entry;
        });

        return result;
    }

    /**
 * Copies a text to clipboard and shows a toast message.
 *
 * @param text Text to be copied
 * @return Promise resolved when text is copied.
 */
    copyToClipboard(text: string): Promise<any> {
        return this.clipboard.copy(text).then(() => {
            // Show toast using ionicLoading.
            return this.domUtils.showToast('core.copiedtoclipboard', 2000, '', true);
        }).catch(() => {
            // Ignore errors.
        });
    }
    /**
  * Execute promises one depending on the previous.
  *
  * @param orderedPromisesData Data to be executed including the following values:
  *                            - func: Function to be executed.
  *                            - context: Context to pass to the function. This allows using "this" inside the function.
  *                            - params: Array of data to be sent to the function.
  *                            - blocking: Boolean. If promise should block the following.
  * @return Promise resolved when all promises are resolved.
  */
    executeOrderedPromises(orderedPromisesData: any[]): Promise<any> {
        const promises = [];
        let dependency = Promise.resolve();
        let context = orderedPromisesData[0].context;
        // Execute all the processes in order.
        for (const i in orderedPromisesData) {
            const data = orderedPromisesData[i];
            let promise;

            // Add the process to the dependency stack.
            promise = dependency.then(() => {
                let prom;

                try {
                    prom = data.func.apply(data.context, data.params || []);
                    context = data.context;
                } catch (e) {
                    return;
                }

                return prom;
            });
            promises.push(promise);

            // If the new process is blocking, we set it as the dependency.
            if (data.blocking) {
                dependency = promise;
            }
        }

        // Return when all promises are done.
        return this.allPromises(promises, context);
    }


    /**
     * Merge two arrays, removing duplicate values.
     *
     * @param array1 The first array.
     * @param array2 The second array.
     * @param [key] Key of the property that must be unique. If not specified, the whole entry.
     * @return Merged array.
     */
    mergeArraysWithoutDuplicates(array1: any[], array2: any[], key?: string): any[] {
        return this.uniqueArray(array1.concat(array2), key);
    }

    /**
     * Return an array without duplicate values.
     *
     * @param array The array to treat.
     * @param [key] Key of the property that must be unique. If not specified, the whole entry.
     * @return Array without duplicate values.
     */
    uniqueArray(array: any[], key?: string): any[] {
        const filtered = [],
            unique = {}; // Use an object to make it faster to check if it's duplicate.

        array.forEach((entry) => {
            const value = key ? entry[key] : entry;

            if (!unique[value]) {
                unique[value] = true;
                filtered.push(entry);
            }
        });

        return filtered;
    }

    /**
     * Check if a value isn't null or undefined.
     *
     * @param value Value to check.
     * @return True if not null and not undefined.
     */
    notNullOrUndefined(value: any): boolean {
        return typeof value != 'undefined' && value !== null;
    }


    /**
     * Open a URL using InAppBrowser.
     * Do not use for files, refer to {@link openFile}.
     *
     * @param url The URL to open.
     * @param options Override default options passed to InAppBrowser.
     * @return The opened window.
     */
    openInApp(url: string, options?: any): InAppBrowserObject {
        if (!url) {
            return;
        }

        options = options || {};
        options.usewkwebview = 'yes'; // Force WKWebView in iOS.

        if (!options.enableViewPortScale) {
            options.enableViewPortScale = 'yes'; // Enable zoom on iOS.
        }

        if (!options.allowInlineMediaPlayback) {
            options.allowInlineMediaPlayback = 'yes'; // Allow playing inline videos in iOS.
        }

        /* if (!options.location && CoreApp.instance.isIOS() && url.indexOf('file://') === 0) { */
        // The URL uses file protocol, don't show it on iOS.
        // In Android we keep it because otherwise we lose the whole toolbar.
        options.location = 'no';
        /* } */

        this.iabInstance = this.iab.create(url, '_blank', options);

        if (this.coreApp.isDesktop() || this.coreApp.isMobile()) {
            let loadStopSubscription;
            const loadStartUrls = [];

            // Trigger global events when a url is loaded or the window is closed. This is to make it work like in Ionic 1.
            const loadStartSubscription = this.iabInstance.on('loadstart').subscribe((event) => {
                // Execute the callback in the Angular zone, so change detection doesn't stop working.
                this.zone.run(() => {
                    // Store the last loaded URLs (max 10).
                    loadStartUrls.push(event.url);
                    if (loadStartUrls.length > 10) {
                        loadStartUrls.shift();
                    }

                    this.eventsProvider.trigger(CoreEventsProvider.IAB_LOAD_START, event);
                });
            });

            if (this.coreApp.isAndroid()) {
                // Load stop is needed with InAppBrowser v3. Custom URL schemes no longer trigger load start, simulate it.
                loadStopSubscription = this.iabInstance.on('loadstop').subscribe((event) => {
                    // Execute the callback in the Angular zone, so change detection doesn't stop working.
                    this.zone.run(() => {
                        if (loadStartUrls.indexOf(event.url) == -1) {
                            // The URL was stopped but not started, probably a custom URL scheme.
                            this.eventsProvider.trigger(CoreEventsProvider.IAB_LOAD_START, event);
                        }
                    });
                });
            }

            const exitSubscription = this.iabInstance.on('exit').subscribe((event) => {
                // Execute the callback in the Angular zone, so change detection doesn't stop working.
                this.zone.run(() => {
                    loadStartSubscription.unsubscribe();
                    loadStopSubscription && loadStopSubscription.unsubscribe();
                    exitSubscription.unsubscribe();
                    this.eventsProvider.trigger(CoreEventsProvider.IAB_EXIT, event);
                });
            });
        }

        return this.iabInstance;
    }

    /**
     * Converts an object into an array, losing the keys.
     *
     * @param obj Object to convert.
     * @return Array with the values of the object but losing the keys.
     */
    objectToArray(obj: object): any[] {
        return Object.keys(obj).map((key) => {
            return obj[key];
        });
    }


    /**
     * Stringify an object, sorting the properties. It doesn't sort arrays, only object properties. E.g.:
     * {b: 2, a: 1} -> '{"a":1,"b":2}'
     *
     * @param obj Object to stringify.
     * @return Stringified object.
     */
    sortAndStringify(obj: object): string {
        return JSON.stringify(this.sortProperties(obj));
    }

    /**
     * Given an object, sort its properties and the properties of all the nested objects.
     *
     * @param obj The object to sort. If it isn't an object, the original value will be returned.
     * @return Sorted object.
     */
    sortProperties(obj: object): object {
        if (obj != null && typeof obj == 'object' && !Array.isArray(obj)) {
            // It's an object, sort it.
            return Object.keys(obj).sort().reduce((accumulator, key) => {
                // Always call sort with the value. If it isn't an object, the original value will be returned.
                accumulator[key] = this.sortProperties(obj[key]);

                return accumulator;
            }, {});
        } else {
            return obj;
        }
    }


    /**
     * Set a timeout to a Promise. If the time passes before the Promise is resolved or rejected, it will be automatically
     * rejected.
     *
     * @param promise The promise to timeout.
     * @param time Number of milliseconds of the timeout.
     * @return Promise with the timeout.
     */
    timeoutPromise<T>(promise: Promise<T>, time: number): Promise<T> {
        return new Promise((resolve, reject): void => {
            const timeout = setTimeout(() => {
                reject({ timeout: true });
            }, time);

            promise.then(resolve).catch(reject).then(() => {
                clearTimeout(timeout);
            });
        });
    }
    /**
     * Ignore errors from a promise.
     *
     * @param promise Promise to ignore errors.
     * @return Promise with ignored errors.
     */

    async ignoreErrors<T>(promise: Promise<T>): Promise<T | undefined> {
        try {
            const result = await promise;

            return result;
        } catch (error) {
            // Ignore errors.
        }
    }

    /**
     * Wait some time.
     *
     * @param milliseconds Number of milliseconds to wait.
     * @return Promise resolved after the time has passed.
     */
    wait(milliseconds: number): Promise<any> {
        return new Promise((resolve, reject): void => {
            setTimeout(resolve, milliseconds);
        });
    }
}
