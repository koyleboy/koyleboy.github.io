/*! Fast Average Color | © 2019 Denis Seleznev | MIT License | https://github.com/hcodes/fast-average-color/ */

(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        global.FastAverageColor = factory();
    }
})(this, function () {
    "use strict";

    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    function slicedToArray(arr, i) {
        return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || nonIterableRest();
    }

    function arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
    }

    function iterableToArrayLimit(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;

        try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                _arr.push(_s.value);
                if (i && _arr.length === i) break;
            }
        } catch (err) {
            _d = true;
            _e = err;
        } finally {
            try {
                if (!_n && _i.return != null) _i.return();
            } finally {
                if (_d) throw _e;
            }
        }

        return _arr;
    }

    function nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }

    var FastAverageColor = /*#__PURE__*/ (function () {
        function FastAverageColor() {
            if (!(this instanceof FastAverageColor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        FastAverageColor.prototype.getColorAsync = function (image, options) {
            if (image.complete) {
                var result = this.getColor(image, options);
                return result.error ? Promise.reject(result.error) : Promise.resolve(result);
            }
            return this._bindImageEvents(image, options);
        };

        FastAverageColor.prototype.getColor = function (image, options) {
            options = options || {};
            var defaultColor = this._getDefaultColor(options);
            var originalSize = this._getOriginalSize(image);
            var size = this._prepareSizeAndPosition(originalSize, options);
            var error = null;
            var result = defaultColor;

            if (!size.srcWidth || !size.srcHeight || !size.destWidth || !size.destHeight) {
                return this._prepareResult(defaultColor, /*new Error("FastAverageColor: Incorrect sizes.")*/ new Error("FastAverageColor: Incorrect sizes. srcWidth: " + size.srcWidth + ", srcHeight: " + size.srcHeight + ", destWidth: " + size.destWidth + ", destHeight: " + size.destHeight));
            }

            if (!this._ctx) {
                this._canvas = this._makeCanvas();
                this._ctx = this._canvas.getContext && this._canvas.getContext("2d");
                if (!this._ctx) {
                    return this._prepareResult(defaultColor, new Error("FastAverageColor: Canvas Context 2D is not supported in this browser."));
                }
            }

            this._canvas.width = size.destWidth;
            this._canvas.height = size.destHeight;

            try {
                this._ctx.clearRect(0, 0, size.destWidth, size.destHeight);
                this._ctx.drawImage(
                    image,
                    size.srcLeft,
                    size.srcTop,
                    size.srcWidth,
                    size.srcHeight,
                    0,
                    0,
                    size.destWidth,
                    size.destHeight
                );
                var imageData = this._ctx.getImageData(0, 0, size.destWidth, size.destHeight).data;
                result = this.getColorFromArray4(imageData, options);
            } catch (err) {
                error = err;
            }

            return this._prepareResult(result, error);
        };

        FastAverageColor.prototype.getColorFromArray4 = function (array, options) {
            options = options || {};
            var length = array.length;
            if (length < 4) return this._getDefaultColor(options);

            var adjustedLength = length - (length % 4);
            var step = 4 * (options.step || 1);
            var algorithmName = "_" + (options.algorithm || "sqrt") + "Algorithm";

            if (typeof this[algorithmName] !== "function") {
                throw new Error("FastAverageColor: " + options.algorithm + " is unknown algorithm.");
            }

            return this[algorithmName](array, adjustedLength, step);
        };

        FastAverageColor.prototype.destroy = function () {
            delete this._canvas;
            delete this._ctx;
        };

        FastAverageColor.prototype._getDefaultColor = function (options) {
            return this._getOption(options, "defaultColor", [255, 255, 255, 255]);
        };

        FastAverageColor.prototype._getOption = function (options, name, defaultValue) {
            return options[name] === undefined ? defaultValue : options[name];
        };

        FastAverageColor.prototype._prepareSizeAndPosition = function (originalSize, options) {
            var left = this._getOption(options, "left", 0);
            var top = this._getOption(options, "top", 0);
            var width = this._getOption(options, "width", originalSize.width);
            var height = this._getOption(options, "height", originalSize.height);
            var destWidth = width;
            var destHeight = height;

            if (options.mode === "precision") {
                return {
                    srcLeft: left,
                    srcTop: top,
                    srcWidth: width,
                    srcHeight: height,
                    destWidth: destWidth,
                    destHeight: destHeight,
                };
            }

            var ratio;
            if (height < width) {
                ratio = width / height;
                destWidth = 100;
                destHeight = Math.round(destWidth / ratio);
            } else {
                ratio = height / width;
                destHeight = 100;
                destWidth = Math.round(destHeight / ratio);
            }

            if (width < destWidth || height < destHeight || destWidth < 10 || destHeight < 10) {
                destWidth = width;
                destHeight = height;
            }

            return {
                srcLeft: left,
                srcTop: top,
                srcWidth: width,
                srcHeight: height,
                destWidth: destWidth,
                destHeight: destHeight,
            };
        };

        FastAverageColor.prototype._simpleAlgorithm = function (array, length, step) {
            var red = 0;
            var green = 0;
            var blue = 0;
            var alpha = 0;
            var count = 0;

            for (var i = 0; i < length; i += step) {
                var a = array[i + 3];
                red += array[i] * a;
                green += array[i + 1] * a;
                blue += array[i + 2] * a;
                alpha += a;
                count++;
            }

            if (!alpha) return [0, 0, 0, 0];
            return [
                Math.round(red / alpha),
                Math.round(green / alpha),
                Math.round(blue / alpha),
                Math.round(alpha / count),
            ];
        };

        FastAverageColor.prototype._sqrtAlgorithm = function (array, length, step) {
            var red = 0;
            var green = 0;
            var blue = 0;
            var alpha = 0;
            var count = 0;

            for (var i = 0; i < length; i += step) {
                var r = array[i];
                var g = array[i + 1];
                var b = array[i + 2];
                var a = array[i + 3];

                red += r * r * a;
                green += g * g * a;
                blue += b * b * a;
                alpha += a;
                count++;
            }

            if (!alpha) return [0, 0, 0, 0];
            return [
                Math.round(Math.sqrt(red / alpha)),
                Math.round(Math.sqrt(green / alpha)),
                Math.round(Math.sqrt(blue / alpha)),
                Math.round(alpha / count),
            ];
        };

        FastAverageColor.prototype._dominantAlgorithm = function (array, length, step) {
            var buckets = {};

            for (var i = 0; i < length; i += step) {
                var red = array[i];
                var green = array[i + 1];
                var blue = array[i + 2];
                var alpha = array[i + 3];
                var key = Math.round(red / 24) + "," + Math.round(green / 24) + "," + Math.round(blue / 24);

                if (buckets[key]) {
                    buckets[key] = [
                        buckets[key][0] + red * alpha,
                        buckets[key][1] + green * alpha,
                        buckets[key][2] + blue * alpha,
                        buckets[key][3] + alpha,
                        buckets[key][4] + 1,
                    ];
                } else {
                    buckets[key] = [red * alpha, green * alpha, blue * alpha, alpha, 1];
                }
            }

            var dominant = slicedToArray(
                Object.keys(buckets)
                    .map(function (key) {
                        return buckets[key];
                    })
                    .sort(function (a, b) {
                        var countA = a[4];
                        var countB = b[4];
                        if (countB < countA) return -1;
                        if (countA === countB) return 0;
                        return 1;
                    })[0],
                5
            );

            var red = dominant[0];
            var green = dominant[1];
            var blue = dominant[2];
            var alpha = dominant[3];
            var count = dominant[4];

            if (!alpha) return [0, 0, 0, 0];
            return [
                Math.round(red / alpha),
                Math.round(green / alpha),
                Math.round(blue / alpha),
                Math.round(alpha / count),
            ];
        };

        FastAverageColor.prototype._bindImageEvents = function (image, options) {
            var self = this;
            return new Promise(function (resolve, reject) {
                function onLoad() {
                    removeListeners();
                    var result = self.getColor(image, options);
                    result.error ? reject(result.error) : resolve(result);
                }

                function onError() {
                    removeListeners();
                    reject(new Error("Image error"));
                }

                function onAbort() {
                    removeListeners();
                    reject(new Error("Image abort"));
                }

                function removeListeners() {
                    image.removeEventListener("load", onLoad);
                    image.removeEventListener("error", onError);
                    image.removeEventListener("abort", onAbort);
                }

                image.addEventListener("load", onLoad);
                image.addEventListener("error", onError);
                image.addEventListener("abort", onAbort);
            });
        };

        FastAverageColor.prototype._prepareResult = function (color, error) {
            var rgb = color.slice(0, 3);
            var rgba = [].concat(rgb, color[3] / 255);
            var isDark = this._isDark(color);

            return {
                error: error,
                value: color,
                rgb: "rgb(" + rgb.join(",") + ")",
                rgba: rgba,
                hex: this._arrayToHex(rgb),
                hexa: this._arrayToHex(color),
                isDark: isDark,
                isLight: !isDark,
            };
        };

        FastAverageColor.prototype._getOriginalSize = function (element) {
            if (element instanceof HTMLImageElement) {
                return { width: element.naturalWidth, height: element.naturalHeight };
            }
            if (element instanceof HTMLVideoElement) {
                return { width: element.videoWidth, height: element.videoHeight };
            }
            return { width: element.width, height: element.height };
        };

        FastAverageColor.prototype._toHex = function (value) {
            var hex = value.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };

        FastAverageColor.prototype._arrayToHex = function (arr) {
            return "#" + arr.map(this._toHex).join("");
        };

        FastAverageColor.prototype._isDark = function (color) {
            return (299 * color[0] + 587 * color[1] + 114 * color[2]) / 1000 < 128;
        };

        FastAverageColor.prototype._makeCanvas = function () {
            return typeof window === "undefined" ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
        };

        return FastAverageColor;
    })();

    return FastAverageColor;
});