(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){


"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var repl_1 = require("./src/repl");
var util_1 = require("./src/util");
var environment_1 = require("./src/object/environment");
var ECS = /** @class */function () {
    function ECS(config) {
        this.window = this.window;
        this.config = config;
    }
    ECS.prototype.repl = function (remoteMode, args) {
        this.env = repl_1.startRepl("cli", remoteMode, args);
    };
    ECS.prototype.webRepl = function () {
        this.env = repl_1.startRepl("web");
    };
    ECS.makeInterpreter = function () {
        return util_1.makeInterpreter();
    };
    ECS.makeEnvironment = function () {
        return new environment_1.Environment();
    };
    ECS.prototype.getEnv = function () {
        return this.env;
    };
    return ECS;
}();
var ecs = new ECS({});
(function () {
    if (typeof Window == 'undefined') {
        // nodejs
        var args = process.argv.slice(2);
        ecs.repl(null, args);
    } else {
        // else if ( not in a web worker )
        ecs.webRepl();
    } // else { // web worker mode
    // (eval("window") as any).ecs = ecs.makeInterpreter();
    // (eval("window") as any).env = ecs.makeEnvironment();
    //   } 
})();

}).call(this,require('_process'))

},{"./src/object/environment":27,"./src/repl":31,"./src/util":37,"_process":6}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":5}],5:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var PrefixExpression = /** @class */function () {
    function PrefixExpression(Token, // The prefix token, e.g. !
    Operator, Right, NodeName) {
        if (NodeName === void 0) {
            NodeName = "PrefixExpression";
        }
        this.Token = Token;
        this.Operator = Operator;
        this.Right = Right;
        this.NodeName = NodeName;
    }
    PrefixExpression.prototype.expressionNode = function () {};
    PrefixExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    PrefixExpression.prototype.String = function () {
        var out = "(";
        out += this.Operator;
        out += this.Right.String();
        out += ")";
        return out;
    };
    return PrefixExpression;
}();
exports.PrefixExpression = PrefixExpression;
var InfixExpression = /** @class */function () {
    function InfixExpression(Token, // The operator token, e.g. +
    Left, Operator, Right, NodeName) {
        if (NodeName === void 0) {
            NodeName = "InfixExpression";
        }
        this.Token = Token;
        this.Left = Left;
        this.Operator = Operator;
        this.Right = Right;
        this.NodeName = NodeName;
    }
    InfixExpression.prototype.expressionNode = function () {};
    InfixExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    InfixExpression.prototype.String = function () {
        var out = "(";
        out += this.Left.String();
        out += " " + this.Operator + " ";
        out += this.Right.String();
        out += ")";
        return out;
    };
    return InfixExpression;
}();
exports.InfixExpression = InfixExpression;
var IfExpression = /** @class */function () {
    function IfExpression(Token, // The 'if' token
    Condition, Consequence, Alternative, NodeName) {
        if (NodeName === void 0) {
            NodeName = "IfExpression";
        }
        this.Token = Token;
        this.Condition = Condition;
        this.Consequence = Consequence;
        this.Alternative = Alternative;
        this.NodeName = NodeName;
    }
    IfExpression.prototype.expressionNode = function () {};
    IfExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    IfExpression.prototype.String = function () {
        var out = "";
        out += "if";
        out += this.Condition.String();
        out += " ";
        out += this.Consequence.String();
        if (this.Alternative != null) {
            out += "else ";
            out += this.Alternative.String();
        }
        return out;
    };
    return IfExpression;
}();
exports.IfExpression = IfExpression;
var ForExpression = /** @class */function () {
    function ForExpression(Token, // The 'for' token
    Element, Range, Consequence, NodeName) {
        if (NodeName === void 0) {
            NodeName = "ForExpression";
        }
        this.Token = Token;
        this.Element = Element;
        this.Range = Range;
        this.Consequence = Consequence;
        this.NodeName = NodeName;
    }
    ForExpression.prototype.expressionNode = function () {};
    ForExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    ForExpression.prototype.String = function () {
        var out = "";
        out += "for ( " + this.Element.String() + ", " + this.Range.String() + " ) {";
        out += this.Consequence.String();
        out += "}";
        return out;
    };
    return ForExpression;
}();
exports.ForExpression = ForExpression;
var WhileExpression = /** @class */function () {
    function WhileExpression(Token, // The 'while' token
    Condition, Consequence, NodeName) {
        if (NodeName === void 0) {
            NodeName = "WhileExpression";
        }
        this.Token = Token;
        this.Condition = Condition;
        this.Consequence = Consequence;
        this.NodeName = NodeName;
    }
    WhileExpression.prototype.expressionNode = function () {};
    WhileExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    WhileExpression.prototype.String = function () {
        var out = "";
        out += "while (" + this.Condition.String() + ") {";
        out += this.Consequence.String();
        out += "}";
        return out;
    };
    return WhileExpression;
}();
exports.WhileExpression = WhileExpression;
var SleepExpression = /** @class */function () {
    function SleepExpression(Token, // The 'while' token
    Duration, Consequence, NodeName) {
        if (NodeName === void 0) {
            NodeName = "SleepExpression";
        }
        this.Token = Token;
        this.Duration = Duration;
        this.Consequence = Consequence;
        this.NodeName = NodeName;
    }
    SleepExpression.prototype.expressionNode = function () {};
    SleepExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    SleepExpression.prototype.String = function () {
        var out = "";
        out += "sleep (" + this.Duration.String() + ") {";
        out += this.Consequence.String();
        out += "}";
        return out;
    };
    return SleepExpression;
}();
exports.SleepExpression = SleepExpression;
var CallExpression = /** @class */function () {
    function CallExpression(Token, // The '(' token
    Function, // Identifier or FunctionLiteral
    Arguments, NodeName) {
        if (Arguments === void 0) {
            Arguments = [];
        }
        if (NodeName === void 0) {
            NodeName = "CallExpression";
        }
        this.Token = Token;
        this.Function = Function;
        this.Arguments = Arguments;
        this.NodeName = NodeName;
    }
    CallExpression.prototype.expressionNode = function () {};
    CallExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    CallExpression.prototype.String = function () {
        var out = "",
            args = [];
        this.Arguments.forEach(function (a) {
            args.push(a.String());
        });
        out += this.Function.String();
        out += "(";
        out += args.join(", ");
        out += ")";
        return out;
    };
    return CallExpression;
}();
exports.CallExpression = CallExpression;
var NewExpression = /** @class */function () {
    function NewExpression(Token, // the token.NEW token
    Name, NodeName) {
        if (NodeName === void 0) {
            NodeName = "NewExpression";
        }
        this.Token = Token;
        this.Name = Name;
        this.NodeName = NodeName;
    }
    NewExpression.prototype.expressionNode = function () {};
    NewExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    NewExpression.prototype.String = function () {
        var out = this.TokenLiteral() + " " + out + this.Name.String();
        return out;
    };
    return NewExpression;
}();
exports.NewExpression = NewExpression;
var ExecExpression = /** @class */function () {
    function ExecExpression(Token, // the token.NEW token
    Name, NodeName) {
        if (NodeName === void 0) {
            NodeName = "ExecExpression";
        }
        this.Token = Token;
        this.Name = Name;
        this.NodeName = NodeName;
    }
    ExecExpression.prototype.expressionNode = function () {};
    ExecExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    ExecExpression.prototype.String = function () {
        var out = this.TokenLiteral() + " " + out + this.Name.String();
        return out;
    };
    return ExecExpression;
}();
exports.ExecExpression = ExecExpression;
var IndexExpression = /** @class */function () {
    function IndexExpression(Token, // The [ token
    Left, Index, NodeName) {
        if (NodeName === void 0) {
            NodeName = "IndexExpression";
        }
        this.Token = Token;
        this.Left = Left;
        this.Index = Index;
        this.NodeName = NodeName;
    }
    IndexExpression.prototype.expressionNode = function () {};
    IndexExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    IndexExpression.prototype.String = function () {
        var out = "";
        out += this.Left.String();
        out += ".";
        out += this.Index.String();
        return out;
    };
    return IndexExpression;
}();
exports.IndexExpression = IndexExpression;
var IndexAssignmentExpression = /** @class */function () {
    function IndexAssignmentExpression(Token, // The [ token
    Left, Index, Assignment, NodeName) {
        if (NodeName === void 0) {
            NodeName = "IndexAssignmentExpression";
        }
        this.Token = Token;
        this.Left = Left;
        this.Index = Index;
        this.Assignment = Assignment;
        this.NodeName = NodeName;
    }
    IndexAssignmentExpression.prototype.expressionNode = function () {};
    IndexAssignmentExpression.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    IndexAssignmentExpression.prototype.String = function () {
        var out = "";
        out += this.Left.String();
        out += ".";
        out += this.Index.String();
        out += "=";
        out += this.Assignment.String();
        return out;
    };
    return IndexAssignmentExpression;
}();
exports.IndexAssignmentExpression = IndexAssignmentExpression;

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function newProgramASTNode() {
    var p = new Program(Array());
    return p;
}
exports.newProgramASTNode = newProgramASTNode;
var Program = /** @class */function () {
    function Program(Statements, NodeName) {
        if (NodeName === void 0) {
            NodeName = "Program";
        }
        this.Statements = Statements;
        this.NodeName = NodeName;
    }
    Program.prototype.TokenLiteral = function () {
        if (this.Statements.length > 0) {
            return this.Statements[0].TokenLiteral();
        } else {
            return "";
        }
    };
    Program.prototype.String = function () {
        var out = "";
        this.Statements.forEach(function (s) {
            out += s.String();
        });
        return out;
    };
    return Program;
}();
exports.Program = Program;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Identifier = /** @class */function () {
    function Identifier(Token, // the token.IDENT token
    Value, NodeName) {
        if (NodeName === void 0) {
            NodeName = "Identifier";
        }
        this.Token = Token;
        this.Value = Value;
        this.NodeName = NodeName;
    }
    Identifier.prototype.String = function () {
        return this.Value;
    };
    Identifier.prototype.expressionNode = function () {};
    Identifier.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    return Identifier;
}();
exports.Identifier = Identifier;
var Boolean = /** @class */function () {
    function Boolean(Token, Value, NodeName) {
        if (NodeName === void 0) {
            NodeName = "Boolean";
        }
        this.Token = Token;
        this.Value = Value;
        this.NodeName = NodeName;
    }
    Boolean.prototype.expressionNode = function () {};
    Boolean.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    Boolean.prototype.String = function () {
        return this.Token.Literal;
    };
    return Boolean;
}();
exports.Boolean = Boolean;
var IntegerLiteral = /** @class */function () {
    function IntegerLiteral(Token, Value, NodeName) {
        if (NodeName === void 0) {
            NodeName = "IntegerLiteral";
        }
        this.Token = Token;
        this.Value = Value;
        this.NodeName = NodeName;
    }
    IntegerLiteral.prototype.expressionNode = function () {};
    IntegerLiteral.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    IntegerLiteral.prototype.String = function () {
        return this.Token.Literal;
    };
    return IntegerLiteral;
}();
exports.IntegerLiteral = IntegerLiteral;
var FloatLiteral = /** @class */function () {
    function FloatLiteral(Token, Value, NodeName) {
        if (NodeName === void 0) {
            NodeName = "FloatLiteral";
        }
        this.Token = Token;
        this.Value = Value;
        this.NodeName = NodeName;
    }
    FloatLiteral.prototype.expressionNode = function () {};
    FloatLiteral.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    FloatLiteral.prototype.String = function () {
        return this.Token.Literal;
    };
    return FloatLiteral;
}();
exports.FloatLiteral = FloatLiteral;
var StringLiteral = /** @class */function () {
    function StringLiteral(Token, Value, NodeName, modifiers) {
        if (NodeName === void 0) {
            NodeName = "StringLiteral";
        }
        this.Token = Token;
        this.Value = Value;
        this.NodeName = NodeName;
        this.modifiers = modifiers;
    }
    StringLiteral.prototype.expressionNode = function () {};
    StringLiteral.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    StringLiteral.prototype.String = function () {
        return this.Token.Literal;
    };
    return StringLiteral;
}();
exports.StringLiteral = StringLiteral;
var FunctionLiteral = /** @class */function () {
    function FunctionLiteral(Token, // The 'fn' token
    Parameters, Body, ObjectContext, NodeName) {
        if (Parameters === void 0) {
            Parameters = [];
        }
        if (NodeName === void 0) {
            NodeName = "FunctionLiteral";
        }
        this.Token = Token;
        this.Parameters = Parameters;
        this.Body = Body;
        this.ObjectContext = ObjectContext;
        this.NodeName = NodeName;
    }
    FunctionLiteral.prototype.expressionNode = function () {};
    FunctionLiteral.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    FunctionLiteral.prototype.String = function () {
        var out = "",
            params = [];
        this.Parameters.forEach(function (p) {
            params.push(p.String());
        });
        out += this.TokenLiteral();
        out += "(" + params.join(", ") + ") ";
        out += this.Body.String();
        return out;
    };
    return FunctionLiteral;
}();
exports.FunctionLiteral = FunctionLiteral;
var StreamLiteral = /** @class */function () {
    function StreamLiteral(Token, // The 'stream' token
    Emit, Body, ObjectContext, NodeName) {
        if (NodeName === void 0) {
            NodeName = "StreamLiteral";
        }
        this.Token = Token;
        this.Emit = Emit;
        this.Body = Body;
        this.ObjectContext = ObjectContext;
        this.NodeName = NodeName;
    }
    StreamLiteral.prototype.expressionNode = function () {};
    StreamLiteral.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    StreamLiteral.prototype.String = function () {
        var out = "";
        out += this.TokenLiteral();
        out += "(" + this.Emit.Value + ") ";
        out += this.Body.String();
        return out;
    };
    return StreamLiteral;
}();
exports.StreamLiteral = StreamLiteral;
var ArrayLiteral = /** @class */function () {
    function ArrayLiteral(Token, // the '[' token
    Elements, NodeName) {
        if (Elements === void 0) {
            Elements = [];
        }
        if (NodeName === void 0) {
            NodeName = "ArrayLiteral";
        }
        this.Token = Token;
        this.Elements = Elements;
        this.NodeName = NodeName;
    }
    ArrayLiteral.prototype.expressionNode = function () {};
    ArrayLiteral.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    ArrayLiteral.prototype.String = function () {
        var out = "",
            elements = [];
        this.Elements.forEach(function (el) {
            elements.push(el.String());
        });
        out += "[";
        out += elements.join(", ");
        out += "]";
        return out;
    };
    return ArrayLiteral;
}();
exports.ArrayLiteral = ArrayLiteral;
var HashLiteral = /** @class */function () {
    function HashLiteral(Token, // the '{' token
    Pairs, NodeName) {
        if (NodeName === void 0) {
            NodeName = "HashLiteral";
        }
        this.Token = Token;
        this.Pairs = Pairs;
        this.NodeName = NodeName;
    }
    HashLiteral.prototype.expressionNode = function () {};
    HashLiteral.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    HashLiteral.prototype.String = function () {
        var out = "",
            pairs = [];
        // this.Pairs.forEach( (value, key) =>{
        // 	pairs.push( key.String()+":"+value.String() )
        // })
        out += "{";
        out += pairs.join(", ");
        out += "}";
        return out;
    };
    return HashLiteral;
}();
exports.HashLiteral = HashLiteral;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var AssignmentStatement = /** @class */function () {
    function AssignmentStatement(Name, Value, NodeName) {
        if (NodeName === void 0) {
            NodeName = "AssignmentStatement";
        }
        this.Name = Name;
        this.Value = Value;
        this.NodeName = NodeName;
    }
    AssignmentStatement.prototype.statementNode = function () {};
    AssignmentStatement.prototype.TokenLiteral = function () {
        return this.Name.Value;
    };
    AssignmentStatement.prototype.String = function () {
        var out = "";
        out += this.Name.String();
        out += " = ";
        if (this.Value != null) {
            out += this.Value.String();
        }
        out += ";";
        return out;
    };
    return AssignmentStatement;
}();
exports.AssignmentStatement = AssignmentStatement;
var LetStatement = /** @class */function () {
    function LetStatement(Token, // the token.LET token
    Name, Value, Vars, NodeName) {
        if (NodeName === void 0) {
            NodeName = "LetStatement";
        }
        this.Token = Token;
        this.Name = Name;
        this.Value = Value;
        this.Vars = Vars;
        this.NodeName = NodeName;
        this.dataType = "";
    }
    LetStatement.prototype.statementNode = function () {};
    LetStatement.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    LetStatement.prototype.String = function () {
        var out;
        out += this.TokenLiteral() + " ";
        out += this.Name.String();
        out += " = ";
        if (this.Value != null) {
            out += this.Value.String();
        }
        out += ";";
        return out;
    };
    return LetStatement;
}();
exports.LetStatement = LetStatement;
var ClassStatement = /** @class */function () {
    function ClassStatement(Token, // the token.LET token
    Name, Value, NodeName) {
        if (NodeName === void 0) {
            NodeName = "ClassStatement";
        }
        this.Token = Token;
        this.Name = Name;
        this.Value = Value;
        this.NodeName = NodeName;
    }
    ClassStatement.prototype.statementNode = function () {};
    ClassStatement.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    ClassStatement.prototype.String = function () {
        var out;
        out += this.TokenLiteral() + " ";
        out += this.Name.String();
        out += " = ";
        if (this.Value != null) {
            out += this.Value.String();
        }
        out += ";";
        return out;
    };
    return ClassStatement;
}();
exports.ClassStatement = ClassStatement;
var ReturnStatement = /** @class */function () {
    function ReturnStatement(Token, // the 'return' token
    ReturnValue, NodeName) {
        if (NodeName === void 0) {
            NodeName = "ReturnStatement";
        }
        this.Token = Token;
        this.ReturnValue = ReturnValue;
        this.NodeName = NodeName;
    }
    ReturnStatement.prototype.statementNode = function () {};
    ReturnStatement.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    ReturnStatement.prototype.String = function () {
        var out = "";
        out += this.TokenLiteral() + " ";
        if (this.ReturnValue != null) {
            out += this.ReturnValue.String();
        }
        out += ";";
        return out;
    };
    return ReturnStatement;
}();
exports.ReturnStatement = ReturnStatement;
var ExpressionStatement = /** @class */function () {
    function ExpressionStatement(Token, // the first token of the expression
    Expression, NodeName) {
        if (NodeName === void 0) {
            NodeName = "ExpressionStatement";
        }
        this.Token = Token;
        this.Expression = Expression;
        this.NodeName = NodeName;
    }
    ExpressionStatement.prototype.statementNode = function () {};
    ExpressionStatement.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    ExpressionStatement.prototype.String = function () {
        if (this.Expression != null) {
            return this.Expression.String();
        }
        return "";
    };
    return ExpressionStatement;
}();
exports.ExpressionStatement = ExpressionStatement;
var BlockStatement = /** @class */function () {
    function BlockStatement(Token, // the { token
    Statements, NodeName) {
        if (Statements === void 0) {
            Statements = [];
        }
        if (NodeName === void 0) {
            NodeName = "BlockStatement";
        }
        this.Token = Token;
        this.Statements = Statements;
        this.NodeName = NodeName;
    }
    BlockStatement.prototype.statementNode = function () {};
    BlockStatement.prototype.TokenLiteral = function () {
        return this.Token.Literal;
    };
    BlockStatement.prototype.String = function () {
        var out = "";
        this.Statements.forEach(function (s) {
            out += s.String();
        });
        return out;
    };
    return BlockStatement;
}();
exports.BlockStatement = BlockStatement;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var evaluator_1 = require("../../evaluator");
var util_1 = require("../../util");
var NULL = {};
var componentMethods = [];
// get component telemetry
util_1.addMethod(componentMethods, "getPosition", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeListToArray(scope != null ? scope.position : [0, 0, 0]);
});
util_1.addMethod(componentMethods, "getRotation", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeListToArray(scope != null ? scope.rotation : [0, 0, 0, 1]);
});
// get data from the component
util_1.addMethod(componentMethods, "getAttrs", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeObjToMap(scope != null ? scope.attrs : {});
});
util_1.addMethod(componentMethods, "getProps", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeObjToMap(scope != null ? scope.props : {});
});
util_1.addMethod(componentMethods, "getState", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeObjToMap(scope != null ? scope.state : {});
});
// update component telemetry
util_1.addMethod(componentMethods, "setPosition", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object.ARRAY_OBJ) {
        return evaluator_1.newError("argument to `Component.setPosition` must be ARRAY[3], got %s", args[0].Type());
    }
    if (args[0].Elements.length != 3) {
        return evaluator_1.newError("argument to `setPosition` must be ARRAY[3], got %s", args[0].Type() + "[" + args[0].Elements.length + "]");
    }
    var newPosition = args[0].Elements.map(function (e) {
        return e.Inspect();
    });
    scope.position = newPosition;
    context.postMessage("component.setPosition", { position: newPosition });
    return NULL;
});
util_1.addMethod(componentMethods, "setRotation", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object.ARRAY_OBJ) {
        return evaluator_1.newError("argument to `Component.setRotation` must be ARRAY[4], got %s", args[0].Type());
    }
    if (args[0].Elements.length != 4) {
        return evaluator_1.newError("argument to `Component.setRotation` must be ARRAY[4], got %s", args[0].Type() + "[" + args[0].Elements.length + "]");
    }
    var newRotation = args[0].Elements.map(function (e) {
        return e.Inspect();
    });
    scope.rotation = newRotation;
    context.postMessage("component.setRotation", { rotation: newRotation });
    return NULL;
});
// set data in the component
util_1.addMethod(componentMethods, "setAttrs", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(componentMethods, "setProps", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(componentMethods, "setState", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
// methods for child components
util_1.addMethod(componentMethods, "addComponent", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(componentMethods, "removeComponent", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(componentMethods, "getComponent", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var components = scope.components,
        comp = {};
    if (args.length > 2) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1-2", args.length);
    }
    if (args[0].Type() != object.INTEGER_OBJ) {
        return evaluator_1.newError("first argument to `Component.getComponent` must be INTEGER, got %s", args[0].Type());
    }
    if (args[1].Type() != object.INTEGER_OBJ) {
        return evaluator_1.newError("second argument to `Component.getComponent` must be STRING, got %s", args[0].Type());
    }
    if (args.length == 1) {
        for (var _a = 0, components_1 = components; _a < components_1.length; _a++) {
            var c = components_1[_a];
            if (c.id == args[0].Inspect()) {
                comp = c;
            }
        }
    } else {
        for (var _b = 0, components_2 = components; _b < components_2.length; _b++) {
            var c = components_2[_b];
            if (c.name == args[1].Inspect()) {
                comp = c;
            }
        }
    }
    return util_1.nativeObjToMap(comp);
});
util_1.addMethod(componentMethods, "listComponents", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeListToArray(scope.components);
});
util_1.addMethod(componentMethods, "updateComponent", "component", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
exports.addMethods = function (component, methods) {
    for (var _i = 0, methods_1 = methods; _i < methods_1.length; _i++) {
        var method = methods_1[_i];
        for (var key in method) {
            component[key] = method[key];
        }
    }
    return component;
};
var makeComponent = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var pairs = {
        "id": {
            Key: new object.String("id"),
            Value: new object.Integer(-1)
        },
        "name": {
            Key: new object.String("name"),
            Value: new object.String("New Component")
        }
    };
    pairs = exports.addMethods(pairs, componentMethods);
    return new object.Hash(pairs);
}, "component");
var getComponent = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var comp = null;
    if (args.length == 0) {
        // return current component
        comp = scope != null ? util_1.nativeObjToMap(scope) : new object.Hash({});
    } else {
        comp = new object.Hash({});
        if (args[0].Type() == object.STRING_OBJ) {// find component by name in current entity
        } else if (args[0].Type() == object.INTEGER_OBJ) {// find component by id
        } else if (args[0].Type() == object.ARRAY_OBJ) {// find component by int array path
        }
    }
    comp = exports.addMethods(comp, componentMethods);
    return comp;
}, "component");
exports.default = util_1.makeBuiltinInterface([["get", getComponent], ["make", makeComponent]]);

},{"../../evaluator":25,"../../object":28,"../../util":37}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var evaluator_1 = require("../../evaluator");
var component_1 = require("./component");
var util_1 = require("../../util");
var NULL = {};
var entityMethods = [];
util_1.addMethod(entityMethods, "getPosition", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeListToArray(scope ? scope.position : [0, 0, 0]);
});
util_1.addMethod(entityMethods, "getRotation", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.nativeListToArray(scope ? scope.rotation : [0, 0, 0, 1]);
});
// update component telemetry
util_1.addMethod(entityMethods, "setPosition", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object.ARRAY_OBJ) {
        return evaluator_1.newError("argument to `Entity[\"setPosition\"]` must be ARRAY[3], got %s", args[0].Type());
    }
    if (args[0].Elements.length != 3) {
        return evaluator_1.newError("argument to `Entity[\"setPosition\"]` must be ARRAY[3], got %s", args[0].Type() + "[" + args[0].Elements.length + "]");
    }
    var newPosition = args[0].Elements.map(function (e) {
        return e.Inspect();
    });
    scope.position = newPosition;
    context.postMessage("entity.setPosition", { position: newPosition });
    return NULL;
});
util_1.addMethod(entityMethods, "setRotation", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object.ARRAY_OBJ) {
        return evaluator_1.newError("argument to `Entity[\"setRotation\"]` must be ARRAY[4], got %s", args[0].Type());
    }
    if (args[0].Elements.length != 4) {
        return evaluator_1.newError("argument to `Entity[\"setRotation\"]` must be ARRAY[4], got %s", args[0].Type() + "[" + args[0].Elements.length + "]");
    }
    var newRotation = args[0].Elements.map(function (e) {
        return e.Inspect();
    });
    scope.rotation = newRotation;
    context.postMessage("entity.setRotation", { rotation: newRotation });
    return NULL;
});
util_1.addMethod(entityMethods, "addComponent", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(entityMethods, "removeComponent", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(entityMethods, "listComponents", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(entityMethods, "getComponent", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
util_1.addMethod(entityMethods, "updateComponent", "entity", function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return NULL;
});
var getEntity = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var ent = new object.Hash({});
    if (args.length == 0) {// return current entity
    } else {
        if (args[0].Type() == object.STRING_OBJ) {// find entity by name in current entity
        } else if (args[0].Type() == object.INTEGER_OBJ) {// find entity by id
        } else if (args[0].Type() == object.ARRAY_OBJ) {// find entity by int array path
        }
    }
    ent = component_1.addMethods(ent, entityMethods);
    return ent;
}, "entity");
var makeEntity = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var ent = new object.Hash({
        "id": {
            Key: new object.String("id"),
            Value: new object.Integer(-1)
        },
        "name": {
            Key: new object.String("name"),
            Value: new object.String("New Entity")
        }
    });
    ent = component_1.addMethods(ent, entityMethods);
    return ent;
}, "entity");
exports.default = util_1.makeBuiltinInterface([["get", getEntity], ["make", makeEntity]]);

},{"../../evaluator":25,"../../object":28,"../../util":37,"./component":11}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var NULL = {};
// define world methods here
exports.default = new object.Hash({});

},{"../../object":28}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var util_1 = require("../../util");
var evaluator_1 = require("../../evaluator");
var util_2 = require("../../util");
var makeCanvas = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length < 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want = 1 to 4", args.length);
    }
    if (args[0].Type() != object.ARRAY_OBJ) {
        return evaluator_1.newError("argument `dimensions` of `graphics.makeCanvas` must be Array[2], got %s", args[0].Type());
    }
    if (args.length > 1) {
        console.log("args one type ");
        console.log(args[1].Type());
        if (args[1].Type() != object.ARRAY_OBJ && args[1].Type() != object.NULL_OBJ) {
            return evaluator_1.newError("argument `pixelRatio` of `graphics.makeCanvas` must be ARRAY[number,number] or null, got %s", args[1].Type());
        }
        if (args.length > 2) {
            if (args[2].Type() != object.STRING_OBJ && args[2].Type() != object.NULL_OBJ) {
                return evaluator_1.newError("argument `format` of `graphics.makeCanvas` must be string or null, got %s", args[2].Type());
            }
            if (args.length == 4) {
                if (args[3].Type() != object.ARRAY_OBJ) {
                    return evaluator_1.newError("argument `data` of `graphics.makeCanvas` must be ARRAY[foamat[0]][format[1]], got %s", args[3].Type());
                }
            }
        }
    }
    var dimensions = args[0].Elements.map(function (elem) {
        return elem.Inspect();
    }),
        format = args[2] ? args[2].Inspect() + "" : "text",
        data = args[3],
        imageData = null,
        rows = [];
    if (data == null) {
        var ten = null,
            one = null,
            grey = null,
            darkGrey = null;
        if (format.indexOf("color") > -1) {
            ten = new object.Integer(ten);
            one = new object.Integer(one);
            grey = new object.Array([ten, ten, ten]);
            darkGrey = new object.Array([one, one, one]);
        }
        for (var y = 0; y < dimensions[1]; y++) {
            var elements = [];
            var o = "";
            for (var x = 0; x < dimensions[0]; x++) {
                var initialData = 0,
                    initialRow = null;
                if (data) {
                    initialRow = data.Elements[y];
                    if (initialRow.Type() == object.STRING_OBJ) {
                        initialData = initialRow.Value[x];
                    } else if (initialRow) {
                        initialData = initialRow.Elements[x];
                    }
                }
                switch (format) {
                    case "text":
                        o = o + "+";
                        break;
                    case "monochrome":
                        elements.push(new object.Integer(10));
                    case "monochrome-compressed":
                        elements.push(new object.Integer(1));
                    case "color":
                        elements.push(grey);
                    case "color-compressed":
                        elements.push(darkGrey);
                }
            }
            if (format == "text") {
                rows.push(new object.String(o));
            } else {
                rows.push(new object.Array(elements));
            }
        }
        imageData = new object.Array(rows);
    } else {
        imageData = args[3];
    }
    var pairs = {};
    pairs.data = { Key: new object.String("data"), Value: imageData };
    pairs.format = { Key: new object.String("format"), Value: args[2] || new object.String("text") };
    pairs.dimensions = { Key: new object.String("dimensions"), Value: args[0] };
    pairs.pixelRatio = { Key: new object.String("pixelRatio"), Value: args[1] || new object.NULL() };
    return new object.Hash(pairs);
}, "graphics"),
    draw = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length < 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    var formatError = "argument `canvas` of `graphics.draw` must be Hash{format: string, dimensions: [number,number], data: array}, got %s";
    if (args[0].Type() != object.HASH_OBJ) {
        return evaluator_1.newError(formatError, args[0].Type());
    }
    var canvas = args[0],
        data = canvas.Pairs.data ? canvas.Pairs.data.Value.Elements : [],
        format = canvas.Pairs.format ? canvas.Pairs.format.Value.Inspect() + "" : "text",
        pixelRatio = canvas.Pairs.pixelRatio && canvas.Pairs.pixelRatio.Value.Type() != object.NULL_OBJ ? canvas.Pairs.pixelRatio.Value.Elements.map(function (elem) {
        return elem.Inspect();
    }) : null;
    if (format == "text") {
        for (var _a = 0, data_1 = data; _a < data_1.length; _a++) {
            var row = data_1[_a];
            if (pixelRatio) {
                var scaled = util_1.scaleString("" + row.Inspect(), pixelRatio),
                    yScale = 0;
                while (yScale < pixelRatio[1]) {
                    util_2.printNativeString(null, null, scaled);
                    yScale += 1;
                }
            } else {
                util_2.println(null, null, [row]);
            }
        }
    } else if (format.indexOf("color") > -1) {
        // let gradient = [" "];
        // for (let row of data) {
        //     let o = 
        // }
        // implement
    } else if (format.indexOf("mono") > -1) {}
    return {};
}, "graphics"),
    fill = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "graphics"),
    dot = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "graphics"),
    line = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "graphics"),
    circle = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "graphics"),
    procedure = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "graphics");
exports.default = util_1.makeBuiltinInterface([["makeCanvas", makeCanvas], ["draw", draw], ["fill", fill], ["dot", dot], ["line", line], ["circle", circle], ["procedure", procedure]]);

},{"../../evaluator":25,"../../object":28,"../../util":37}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var token_1 = require("../token");
var docs = new Map();
docs.set("keywords", ["Keywords: |                                                                                                ║", "fn        | fn(?param1, ?param2...) { ?<statement>; ?<statement>... ?return <expression>; }                ║", "let       | let identifierName = <expression>;                                                             ║", "class     | class ClassName { \"ClassName\": fn(){ }, <HashPair>... }                                        ║", "new       | new ClassName(?param1, ?param2...)                                                             ║", "if        | if (<boolean expression>) { <statement>; <statement>... } else { <statement>; <statement>... } ║", "else      | if (...) { ... } else { <statement>; <statement>... }                                          ║", "for       | for (<identifier>, <number | string | array | hashmap>) { }                                    ║", "while     | while (<boolean expression>) { <statement>; <statement>... }                                   ║", "sleep     | sleep (<integer expression>) { <statement>; <statement>... }                                   ║", "return    | return <expression>;                                                                           ║", "this      | this                                                                                           ║", "true      | true                                                                                           ║", "false     | false                                                                                          ║", "exec      | exec \"other-script.ecs\"                                                                        ║"]);
docs.set("delimiters", ["Delimiters: |", token_1.COMMA + "           | Comma", token_1.SEMICOLON + "           | Semicolon", token_1.COLON + "           | Colon", token_1.LPAREN + "           | Left Parenthesis", token_1.RPAREN + "           | Right Parenthesis", token_1.LBRACE + "           | Left Brace", token_1.RBRACE + "           | Right Brace", token_1.LBRACKET + "           | Left Bracket", token_1.RBRACKET + "           | Right Bracket"]);
docs.set("operators", ["Operators: |", token_1.ASSIGN + "          | Assign", token_1.PLUS + "          | Plus / Addition", token_1.BANG + "          | Bang / Not", token_1.MINUS + "          | Minus", token_1.SLASH + "          | Slash / Divide", token_1.ASTERISK + "          | Asterisk / Multiply", token_1.MOD + "          | Mod / Remainder", token_1.LT + "          | Less Than", token_1.GT + "          | Greater Than", token_1.EQ + "         | Is Equal To", token_1.NOT_EQ + "         | Is Not Equal", "typeof" + "     | Name Of Type", token_1.AND + "         | And", token_1.OR + "         | Or", token_1.SOURCE + "         | Source (coming soon)", token_1.SINK + "         | Sink (coming soon)", token_1.INSERTION + "         | Insert (coming soon)", token_1.EXTRACTION + "         | Extract (coming soon)"]);
docs.set("builtins", ["║ Builtin Functions:  ", "╠═════════════════════════════════════════════════════════════════════", "║ print            │ print( <string> value ): void", "║                  │ prints string to console", "╠══════════════════╩══════════════════════════════════════════════════", "║ push             │ push( array, any ): array", "║                  │ adds item to end of array", "╠══════════════════╩══════════════════════════════════════════════════", "║ len              │ len( array|string ): number", "║                  │ returns length of array or string", "╠══════════════════╩══════════════════════════════════════════════════", "║ join             │ join( string[]|number[], string ): string", "║                  │ joins an array of strings or numbers into one string.", "║                  │ second argument is the string to splice in between", "╠══════════════════╩══════════════════════════════════════════════════", "║ floor            │ floor( number ): number", "║                  │ returns number rounded down", "╠══════════════════╩══════════════════════════════════════════════════", "║ ceil             │ ceil( number ): number", "║                  │ returns number rounded up", "╠══════════════════╩══════════════════════════════════════════════════", "║ fract            │ fract( number ): number", "║                  │ returns fractional portion of number", "╠══════════════════╩══════════════════════════════════════════════════", "║ abs              │ abs( number ): number", "║                  │ returns absolute value of number", "╠══════════════════╩══════════════════════════════════════════════════", "║ sqrt             │ sqrt( number ): number", "║                  │ returns square root of number", "╠══════════════════╩══════════════════════════════════════════════════", "║ PI               │ PI(): number", "║                  │ returns constant pi", "╠══════════════════╩══════════════════════════════════════════════════", "║ sin              │ sin( number ): number", "║                  │ returns sine of number in radians", "╠══════════════════╩══════════════════════════════════════════════════", "║ cos              │ cos( number ): number", "║                  │ returns cosine of number in radians", "╠══════════════════╩══════════════════════════════════════════════════", "║ tan              │ tan( number ): number", "║                  │ returns tangent of number in radians", "╠══════════════════╩══════════════════════════════════════════════════", "║ atan2            │ atan2( number ): number", "║                  │ returns atan2 of number in radians", "╠══════════════════╩══════════════════════════════════════════════════", "║ time             │ time(): number", "║                  │ returns current time in milliseconds"]);
docs.set("print", "builtins");
docs.set("push", "builtins");
docs.set("len", "builtins");
docs.set("join", "builtins");
docs.set("floor", "builtins");
docs.set("ceil", "builtins");
docs.set("fract", "builtins");
docs.set("abs", "builtins");
docs.set("sqrt", "builtins");
docs.set("PI", "builtins");
docs.set("sin", "builtins");
docs.set("cos", "builtins");
docs.set("tan", "builtins");
docs.set("atan2", "builtins");
docs.set("time", "builtins");
docs.set("component", ["component", "{", "   make: builtin", "   get: builtin", "}"]);
docs.set("entity", ["entity", "{", "   make: builtin", "   get: builtin", "}"]);
docs.set("world", ["World", "{", "}"]);
docs.set("os", ["os", "{", "   touch: builtin", "   mkdir: builtin", "   pwd: builtin", "   ls: builtin", "   cat: builtin", "   rm: builtin", "}"]);
docs.set("graphics", ["graphics", "{", "   makeCanvas: builtin(dimensions: number[], format?: string, data?: string[]|number[][]|number[][][])", "   draw: builtin", "   fill: builtin", "   dot: builtin", "   line: builtin", "   circle: builtin", "   procedure: builtin", "}"]);
docs.set("io", ["io", "{", "}"]);
docs.set("terminal", ["Terminal", "{", "   getDimensions: builtin(): number[]", "   hasColorSupport: builtin(): boolean", "   has3dSupport: builtin(): boolean", "   beep: builtin(): void", "}"]);
docs.set("Table", ["Hashmap", "{", "   build: builtin", "   display: builtin", "}"]);
var getHelp = function getHelp(docName) {
    var helpResults = docs.get(docName);
    if (typeof helpResults == "string") {
        helpResults = docs.get(helpResults);
    }
    return helpResults ? helpResults : [];
};
exports.getHelp = getHelp;
var listAllDocs = function listAllDocs() {
    var keys = [],
        key = "";
    var foundDocs = docs.keys();
    while (key = foundDocs.next().value) {
        if (typeof docs.get(key) != "string") {
            keys.push(key);
        }
    }
    return keys;
};
exports.listAllDocs = listAllDocs;

},{"../token":36}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../object");
var object_1 = require("../object");
var evaluator_1 = require("../evaluator");
var help_1 = require("./help");
var help_2 = require("./help");
var io_1 = require("./io");
var os_1 = require("./os");
var maths_1 = require("./maths");
var json_1 = require("./io/json");
var regex_1 = require("./regex");
var graphics_1 = require("./graphics");
var terminal_1 = require("./terminal");
var table_1 = require("./terminal/table");
var component_1 = require("./convolvr/component");
var entity_1 = require("./convolvr/entity");
var world_1 = require("./convolvr/world");
var util_1 = require("../util");
var BUILTIN = object.BUILTIN_OBJ,
    NULL = {};
exports.builtins = {
    "graphics": graphics_1.default,
    "io": io_1.default,
    "os": os_1.default,
    "Table": table_1.default,
    "terminal": terminal_1.default,
    "component": component_1.default,
    "entity": entity_1.default,
    "world": world_1.default,
    "Math": maths_1.default,
    "JSON": json_1.default,
    "RegExp": regex_1.default,
    "time": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return new object.Integer(Date.now());
    }),
    "print": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        util_1.println(context, scope, args);
        return NULL;
    }),
    "len": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (args.length != 1) {
            return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
        }
        var arg = args[0],
            argType = arg.Type();
        switch (argType) {
            case object_1.ARRAY_OBJ:
                return new object.Integer(arg.Elements.length);
            case object_1.STRING_OBJ:
                return new object.Integer(arg.Value.length);
            default:
                return evaluator_1.newError("argument to `len` not supported, got %s", args[0].Type());
        }
    }),
    "first": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (args.length != 1) {
            return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
        }
        if (args[0].Type() != object.ARRAY_OBJ) {
            return evaluator_1.newError("argument to `first` must be ARRAY, got %s", args[0].Type());
        }
        var arr = args[0];
        if (arr.Elements.length > 0) {
            return arr.Elements[0];
        }
        return NULL;
    }),
    "last": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (args.length != 1) {
            return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
        }
        if (args[0].Type() != object.ARRAY_OBJ) {
            return evaluator_1.newError("argument to `last` must be ARRAY, got %s", args[0].Type());
        }
        var arr = args[0],
            length = arr.Elements.length;
        if (length > 0) {
            return arr.Elements[length - 1];
        }
        return NULL;
    }),
    "push": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (args.length != 2) {
            return evaluator_1.newError("wrong number of arguments. got=%d, want=2", args.length);
        }
        if (args[0].Type() != object.ARRAY_OBJ) {
            return evaluator_1.newError("argument to `push` must be ARRAY, got %s", args[0].Type());
        }
        var arr = args[0],
            newArr = arr.Elements.slice();
        newArr.push(args[1]);
        return new object.Array(newArr);
    }),
    "join": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (args.length != 2) {
            return evaluator_1.newError("wrong number of arguments. got=%d, want=2", args.length);
        }
        if (args[0].Type() != object_1.ARRAY_OBJ) {
            return evaluator_1.newError("first argument to `join` must be ARRAY, got %s", args[0].Type());
        }
        if (args[1].Type() != object_1.STRING_OBJ) {
            return evaluator_1.newError("second argument to `join` must be STRING, got %s", args[0].Type());
        }
        var strArray = [],
            arr = args[0];
        arr.Elements.forEach(function (element) {
            var s = "";
            s = element.Inspect();
            strArray.push(s);
        });
        var outStr = strArray.join(args[1].Value);
        return new object.String(outStr);
    }),
    "man": new object.Builtin(function (context, scope) {
        if (context === void 0) {
            context = null;
        }
        if (scope === void 0) {
            scope = null;
        }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var helpKey = "",
            htmlMode = typeof Window != 'undefined';
        if (args.length != 1) {
            return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
        }
        if (args[0].Type() == object.BUILTIN_OBJ) {
            console.log(args[0].Fn.toString());
        } else {
            if (args[0].Type() != object.STRING_OBJ) {
                return evaluator_1.newError("argument to `man` must be STRING, got %s", args[0].Type());
            }
            helpKey = args[0].Value;
            var helpElems = [],
                helpStrs = help_2.getHelp(helpKey);
            var leftBorder_1 = helpKey != "builtins";
            console.log("");
            console.log("╔════════════════════════════════════════════════════════════════════════════════════════════════════════════╗");
            helpStrs.forEach(function (helpStr) {
                console.log((leftBorder_1 ? "║ " : "") + helpStr);
            });
            console.log("╚════════════════════════════════════════════════════════════════════════════════════════════════════════════╝");
        }
        return new object.String("");
    }),
    "help": new object.Builtin(function () {
        var helpElems = [],
            helpStrs = help_1.listAllDocs();
        console.log("");
        console.log("╔═══════════════════════════════════════════════╗");
        console.log("║ Help Topics              💡  man(\"topicName\"); ║");
        console.log("╚═══════════════════════════════════════════════╝");
        helpStrs.forEach(function (helpStr) {
            helpElems.push(new object.String(helpStr));
        });
        return new object.Array(helpElems);
    })
};

},{"../evaluator":25,"../object":28,"../util":37,"./convolvr/component":11,"./convolvr/entity":12,"./convolvr/world":13,"./graphics":14,"./help":15,"./io":18,"./io/json":19,"./maths":20,"./os":21,"./regex":22,"./terminal":23,"./terminal/table":24}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.readWholeFile = function (path, fs) {
    if (fs) {
        return new Promise(function (resolve, reject) {
            fs.readFile(path, "utf8", function (err, data) {
                if (err) reject();
                resolve(data);
            });
        });
    } else {
        // browser implementation
    }
};
function writeLineToFile(src, data, fs) {
    fs.appendFile(src, data, function (err) {
        if (err) throw err;
        console.log('The "data to append" was appended to file!');
    });
}
exports.writeLineToFile = writeLineToFile;
function openFile(src, data, fs) {}
exports.openFile = openFile;
function readLineFromFile(src, data, fs) {}
exports.readLineFromFile = readLineFromFile;
function hasNextLine(src, data, fs) {}
exports.hasNextLine = hasNextLine;

},{}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var evaluator_1 = require("../../evaluator");
var util_1 = require("../../util");
var file_1 = require("./file");
var fs = require("fs");
var httpGetErr = "invalind number of parameters: http.get(url:string, callback?:fn(response: string){})",
    httpPostErr = "invalind number of parameters: http.post(url:string, payload?:hash, callback?:fn(response: string){})",
    httpPutErr = "invalind number of parameters: http.put(url:string, payload?:hash, callback?:fn(response: string){})",
    httpDeleteErr = "invalind number of parameters: http.delete(url:string, payload?:hash, callback?:fn(response: string){})",
    httpRequestFailed = "request failed: ";
var httpGet = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length == 0 || args.length > 2) {
        return evaluator_1.newError(httpGetErr);
    }
    return new object.Boolean(false);
}, "http"),
    httpPost = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length == 0 || args.length > 2) {
        return evaluator_1.newError(httpPostErr);
    }
    return new object.Boolean(false);
}, "http"),
    httpPut = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length == 0 || args.length > 2) {
        return evaluator_1.newError(httpPutErr);
    }
    return new object.Boolean(false);
}, "http"),
    httpDelete = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length == 0 || args.length > 2) {
        return evaluator_1.newError(httpDeleteErr);
    }
    return new object.Boolean(false);
}, "http");
var socketConnectError = "",
    socketSendError = "",
    socketOnEventError = "";
var socketConnect = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.Boolean(false);
}, "socket"),
    socketDisconnect = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.Boolean(false);
}, "socket"),
    socketSend = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.Boolean(false);
}, "socket"),
    socketOnEvent = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.Boolean(false);
}, "socket");
var createFileError = "",
    fileReadLineError = "",
    fileWriteLineError = "";
var fileConstructor = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length > 0) {
        scope.Pairs["resource"].Value = args[0];
    }
    return new object.Boolean(true);
}, "object"),
    fileOpen = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.Boolean(false);
}, "file"),
    fileReadAll = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length < 1 || args[0].Type() != object.FUNCTION_OBJ) {
        return evaluator_1.newError("argument to readAll must be callback function");
    }
    file_1.readWholeFile(scope.Pairs.resource.Value.Inspect() + "", fs).then(function (data) {
        evaluator_1.applyFunction(args[0], null, [new object.String(data)], null);
    });
    return new object.NULL();
}, "object"),
    fileWriteLine = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    file_1.writeLineToFile(scope.Pairs.resource.Value.Inspect() + "", args[1].Inspect(), fs);
    return new object.Boolean(true);
}, "file"),
    fileReadLine = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.String("not implemented");
}, "file"),
    fileHasNextLine = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.String("not implemented");
}, "object");
var readLn = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.platformSpecificCall(context, scope, function () {
        return new object.String(util_1.readStdInSync());
    }, function () {
        return util_1.readLineFromDocument();
    }, function () {
        return util_1.workerNativeCall(context, scope, "readLine", args);
    });
}, "io");
var HTTP = util_1.makeBuiltinInterface([["get", httpGet], ["post", httpPost], ["put", httpPut], ["delete", httpDelete]]),
    Socket = util_1.makeBuiltinInterface([["connect", socketConnect], ["disconnect", socketDisconnect], ["send", socketSend], ["onEvent", socketOnEvent]]),
    File = util_1.makeBuiltinClass("File", [["resource", new object.String("")], ["File", fileConstructor], ["open", fileOpen], ["hasNextLine", fileHasNextLine], ["readLine", fileReadLine], ["writeLine", fileWriteLine], ["readAll", fileReadAll]]);
exports.default = util_1.makeBuiltinInterface([["File", File], ["HTTP", HTTP], ["Socket", Socket], ["readLine", readLn]]);

},{"../../evaluator":25,"../../object":28,"../../util":37,"./file":17,"fs":3}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var evaluator_1 = require("../../evaluator");
var util_1 = require("../../util");
var object = require("../../object");
var stringify = new object.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var data;
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments to json. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object.HASH_OBJ && args[0].Type() != object.ARRAY_OBJ) {
        return evaluator_1.newError("argument to `json` must be HASH or ARRAY, got %s", args[0].Type());
    }
    if (args[0].Type() == object.HASH_OBJ) {
        data = util_1.objectToNativeObject(args[0]);
    } else {
        data = util_1.arrayToNativeList(args[0]);
    }
    return new object.String(JSON.stringify(data));
});
var parse = new object.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments to parseJson. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object.STRING_OBJ) {
        return evaluator_1.newError("argument to `parseJson` must be STRING, got %s", args[0].Type());
    }
    var obj = JSON.parse(args[0].Value);
    return typeof obj.length == "number" ? util_1.nativeListToArray(obj) : util_1.nativeObjToMap(obj);
});
exports.default = util_1.makeBuiltinInterface([["parse", parse], ["stringify", stringify]]);

},{"../../evaluator":25,"../../object":28,"../../util":37}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../util");
var object_1 = require("../object");
var evaluator_1 = require("../evaluator");
exports.default = util_1.makeBuiltinInterface([["PI", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object_1.Integer(Math.PI);
})], ["sin", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `sin` must be float, got %s", args[0].Type());
    }
    return new object_1.Float(Math.sin(args[0].Value));
})], ["cos", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `cos` must be float, got %s", args[0].Type());
    }
    return new object_1.Float(Math.cos(args[0].Value));
})], ["tan", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `cos` must be float, got %s", args[0].Type());
    }
    return new object_1.Float(Math.tan(args[0].Value));
})], ["atan2", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 2) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=2", args.length);
    }
    if (args[0].Type() != object_1.FLOAT_OBJ || args[1].Type() != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("arguments to `atan2` must be float, got %s %s", args[0].Type(), args[1].Type());
    }
    return new object_1.Float(Math.atan2(args[0].Value, args[1].Value));
})], ["ceil", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `abs` must be float, got %s", args[0].Type());
    }
    return new object_1.Integer(Math.ceil(args[0].Value));
})], ["fract", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `abs` must be float, got %s", args[0].Type());
    }
    return new object_1.Integer(args[0].Value - Math.floor(args[0].Value));
})], ["sqrt", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    var type = args[0].Type();
    if (type != object_1.INTEGER_OBJ && type != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `cos` must be float, got %s", args[0].Type());
    }
    return new object_1.Integer(Math.sqrt(args[0].Value));
})], ["abs", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    var type = args[0].Type();
    if (type != object_1.INTEGER_OBJ && type != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `abs` must be integer or float, got %s", args[0].Type());
    }
    return new object_1.Integer(Math.abs(args[0].Value));
})], ["floor", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    if (args[0].Type() != object_1.FLOAT_OBJ) {
        return evaluator_1.newError("argument to `abs` must be float, got %s", args[0].Type());
    }
    return new object_1.Integer(Math.floor(args[0].Value));
})]]);

},{"../evaluator":25,"../object":28,"../util":37}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var util_1 = require("../../util");
var touch = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.Boolean(scope != null ? scope.hasColorSupport : false);
}, "os"),
    mkdir = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "os"),
    pwd = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "os"),
    ls = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "os"),
    cat = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "os"),
    rm = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return {};
}, "os");
exports.default = util_1.makeBuiltinInterface([["touch", touch], ["mkdir", mkdir], ["pwd", pwd], ["ls", ls], ["cat", cat], ["rm", rm]]);

},{"../../object":28,"../../util":37}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../util");
var evaluator_1 = require("../evaluator");
var object_1 = require("../object");
exports.default = util_1.makeBuiltinClass("RegExp", [["RegExp", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    scope.builtins.kernel = new RegExp(args[0].Inspect() + "");
    return new object_1.NULL();
})], ["test", new object_1.Builtin(function (context, scope) {
    if (context === void 0) {
        context = null;
    }
    if (scope === void 0) {
        scope = null;
    }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (args.length != 1) {
        return evaluator_1.newError("wrong number of arguments. got=%d, want=1", args.length);
    }
    return new object_1.Boolean(scope.builtins.kernel.test(args[0].Inspect()));
})]]);

},{"../evaluator":25,"../object":28,"../util":37}],23:[function(require,module,exports){
(function (process){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var util_1 = require("../../util");
var TRUE = new object.Boolean(true),
    FALSE = new object.Boolean(false),
    NULL_VALUE = new object.NULL();
exports.getTerminalSize = function (scope) {
    if (scope === void 0) {
        scope = null;
    }
    var stdout = process ? process.stdout : null;
    return [new object.Integer(stdout != null ? stdout.columns : scope ? scope.width : -2), new object.Integer(stdout != null ? stdout.rows : scope ? scope.height : -2)];
};
var getDimensions = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new object.Array(exports.getTerminalSize(scope));
}, "terminal"),
    hasColorSupport = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.platformSpecificCall(context, scope, function () {
        return TRUE;
    }, function () {
        return FALSE;
    }, function () {
        return TRUE;
    });
}, "terminal"),
    has3dSupport = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return util_1.platformSpecificCall(context, scope, function () {
        return FALSE;
    }, function () {
        return TRUE;
    }, function () {
        return TRUE;
    });
}, "terminal"),
    beep = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    util_1.platformSpecificCall(context, scope, function () {
        return console.log("\x07");
    }, function () {}, function () {
        util_1.workerNativeCall(context, scope, "beep", []);
    });
    return NULL_VALUE;
}, "terminal");
exports.default = util_1.makeBuiltinInterface([["getDimensions", getDimensions], ["hasColorSupport", hasColorSupport], ["has3dSupport", has3dSupport], ["beep", beep]]);

}).call(this,require('_process'))

},{"../../object":28,"../../util":37,"_process":6}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("../../object");
var util_1 = require("../../util");
var tableConstructor = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var rowData = [],
        colData = [];
    if (args.length > 0) {
        scope.data.Value = args[0];
    }
    if (args.length > 1) {
        scope.columns = args[1];
    }
    if (args.length > 2) {
        scope.config = args[2];
    }
    return new object.NULL();
}, "object"),
    display = new object.Builtin(function (context, scope) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    // this needs objectContext / scope will be undefined otherwise
    for (var _a = 0, _b = scope.data.Elements; _a < _b.length; _a++) {
        var d = _b[_a];
        util_1.printNativeString(null, null, d.Inspect() + "");
    }
    return new object.String("");
}, "object");
exports.default = util_1.makeBuiltinClass("Table", [["Table", tableConstructor], ["display", display]]);

},{"../../object":28,"../../util":37}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("./object");
var environment = require("./object/environment");
var builtins_1 = require("./builtins");
var util_1 = require("./util");
var file_1 = require("./builtins/io/file");
var object_1 = require("./object");
var fs = require("fs");
var TRUE = new object.Boolean(true),
    FALSE = new object.Boolean(false),
    NULL = new object.NULL();
var embeddedInterpreter;
function newError(format) {
    var a = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        a[_i - 1] = arguments[_i];
    }
    return new object.Error(util_1.sprintf.apply(void 0, [format].concat(a, ["\x07"])));
}
exports.newError = newError;
function nativeBoolToBooleanEObject(input) {
    if (input) {
        return TRUE;
    }
    return FALSE;
}
function Eval(node, env, objectContext) {
    if (!!!node) {
        return;
    }
    var left = null,
        right = null,
        index = null,
        val = null;
    switch (node.NodeName) {
        // Statements
        case "Program":
            return evalProgram(node, env);
        case "BlockStatement":
            return evalBlockStatement(node, env, objectContext);
        case "ReturnStatement":
            val = Eval(node.ReturnValue, env, objectContext);
            if (isError(val)) {
                return val;
            }
            return new object.ReturnValue(val);
        case "ClassStatement":
            val = Eval(node.Value, env, objectContext);
            if (isError(val)) {
                return val;
            }
            var pair = val.Pairs[node.Name.Value],
                constructor = pair ? pair.Value : null;
            if (constructor != null) {
                val.Constructor = constructor;
            }
            env.set(node.Name.Value, val);
            break;
        case "LetStatement":
            if (node.Vars) {
                for (var _i = 0, _a = node.Vars; _i < _a.length; _i++) {
                    var v = _a[_i];
                    val = Eval(v[1], env, objectContext);
                    if (isError(val)) {
                        return val;
                    }
                    env.set(v[0].Value, val);
                }
            } else {
                val = Eval(node.Value, env, objectContext);
                if (isError(val)) {
                    return val;
                }
                env.set(node.Name.Value, val);
            }
            break;
        case "AssignmentStatement":
            val = Eval(node.Value, env, objectContext);
            if (isError(val)) {
                return val;
            }
            env.set(node.Name.Value, val);
            break;
        case "ExpressionStatement":
            return Eval(node.Expression, env, objectContext);
        // Expressions
        case "PrefixExpression":
            right = Eval(node.Right, env, objectContext);
            if (isError(right)) {
                return right;
            }
            return evalPrefixExpression(node.Operator, right);
        case "InfixExpression":
            left = Eval(node.Left, env, objectContext);
            if (isError(left)) {
                return left;
            }
            right = Eval(node.Right, env, objectContext);
            if (isError(right)) {
                return right;
            }
            return evalInfixExpression(node.Operator, left, right);
        case "CallExpression":
            var fun = Eval(node.Function, env); //, node.Function.ObjectContext); // objectContext);
            if (isError(fun)) {
                return fun;
            }
            var args = evalExpressions(node.Arguments, env, objectContext);
            if (args.length == 1 && isError(args[0])) {
                return args[0];
            }
            return applyFunction(fun, env, args, objectContext);
        case "IndexExpression":
            left = Eval(node.Left, env, objectContext);
            if (isError(left)) {
                return left;
            }
            index = Eval(node.Index, env, objectContext);
            if (isError(index)) {
                return index;
            }
            return evalIndexExpression(left, index, objectContext);
        case "IndexAssignmentExpression":
            left = Eval(node.Left, env, objectContext);
            if (isError(left)) {
                return left;
            }
            index = Eval(node.Index, env, objectContext);
            if (isError(index)) {
                return index;
            }
            var assignment = Eval(node.Assignment, env, objectContext);
            if (isError(assignment)) {
                return assignment;
            }
            return evalIndexAssignmentExpression(left, index, assignment, objectContext);
        case "Boolean":
            return nativeBoolToBooleanEObject(node.Value);
        case "IntegerLiteral":
            return new object.Integer(node.Value);
        case "FloatLiteral":
            return new object.Float(node.Value);
        case "FunctionLiteral":
            var params = node.Parameters,
                body = node.Body;
            return new object.Function(params, body, env, null, objectContext); //TODO: probably pass object context here
        case "StringLiteral":
            return new object.String(node.Value);
        case "ArrayLiteral":
            var elements = evalExpressions(node.Elements, env);
            if (elements.length == 1 && isError(elements[0])) {
                return elements[0];
            }
            return new object.Array(elements);
        case "HashLiteral":
            return evalHashLiteral(node, env);
        case "IfExpression":
            return evalIfExpression(node, env, objectContext);
        case "ForExpression":
            return evalForExpression(node, env, objectContext);
        case "WhileExpression":
            return evalWhileExpression(node, env, objectContext);
        case "SleepExpression":
            return evalSleepExpression(node, env, objectContext);
        case "NewExpression":
            return evalNewExpression(node, env, objectContext);
        case "ExecExpression":
            return evalExecExpression(node, env, objectContext);
        case "Identifier":
            return evalIdentifier(node, env, objectContext);
    }
    return null;
}
exports.Eval = Eval;
embeddedInterpreter = util_1.makeInterpreter(Eval);
function evalProgram(program, env) {
    var result;
    //   console.log(JSON.stringify(program, null, 4));
    program.Statements.forEach(function (statement) {
        result = Eval(statement, env);
        if (!!!result) {
            return;
        }
        if (!result.Message) {
            return result.Value;
        } else {
            return result;
        }
    });
    return result;
}
exports.evalProgram = evalProgram;
function evalStatements(stmts, env) {
    var result;
    stmts.forEach(function (statement) {
        result = Eval(statement, env);
        var returnValue = new object.ReturnValue(result),
            ok = returnValue != null;
        if (ok) {
            return returnValue.Value;
        }
    });
    return result;
}
function evalBlockStatement(block, env, objectContext) {
    var result;
    block.Statements.forEach(function (statement) {
        result = Eval(statement, env, objectContext);
        if (result != null && result != undefined) {
            var rt = result && result.Type ? result.Type() : null;
            if (rt == object.RETURN_VALUE_OBJ || rt == object.ERROR_OBJ) {
                return result;
            }
        }
    });
    return result;
}
function evalExpressions(exps, env, objectContext) {
    var result = [];
    exps.forEach(function (e) {
        var evaluated = Eval(e, env, objectContext);
        if (isError(evaluated)) {
            return Array();
        }
        result.push(evaluated);
    });
    return result;
}
function evalPrefixExpression(operator, right) {
    switch (operator) {
        case "!":
            return evalBangOperatorExpression(right);
        case "-":
            return evalMinusPrefixOperatorExpression(right);
        case "typeof":
            return evalTypeofExpression(right);
        default:
            return newError("unknown operator: %s%s", operator, right.Type());
    }
}
function evalInfixExpression(operator, left, right) {
    var leftType = left.Type(),
        rightType = right.Type();
    if (operator == "==") {
        return nativeBoolToBooleanEObject(left.Value == right.Value);
    } else if (operator == "!=") {
        return nativeBoolToBooleanEObject(left.Value != right.Value);
    }
    if (leftType == object_1.INTEGER_OBJ || leftType == object_1.FLOAT_OBJ || rightType == object_1.INTEGER_OBJ || rightType == object_1.FLOAT_OBJ) {
        if (leftType == object_1.INTEGER_OBJ && rightType == object_1.INTEGER_OBJ) {
            return evalIntegerInfixExpression(operator, left, right);
        } else if (rightType == object_1.FLOAT_OBJ || leftType == object_1.FLOAT_OBJ) {
            return evalFloatInfixExpression(operator, left, right);
        }
    } else if (leftType == object.BOOLEAN_OBJ && rightType == object.BOOLEAN_OBJ) {
        return evalBooleanInfixExpression(operator, left, right);
    } else if (leftType == object.STRING_OBJ && rightType == object.STRING_OBJ) {
        return evalStringInfixExpression(operator, left, right);
    } else if (leftType != rightType) {
        if (leftType == object.STRING_OBJ) {
            return evalStringConcatExpression(left, right, true);
        } else if (rightType == object.STRING_OBJ) {
            // leftType == INTEGER_OBJ &&
            return evalStringConcatExpression(left, right, false);
        }
        return newError("type mismatch: %s %s %s", leftType, operator, rightType);
    } else {
        return newError("unknown operator: %s %s %s", leftType, operator, rightType);
    }
}
function evalTypeofExpression(right) {
    if (right.Type() == object.HASH_OBJ && right.className != null) {
        return new object.String(right.className);
    } else {
        return new object.String(right.Type());
    }
}
function evalStringConcatExpression(left, right, stringFirst) {
    if (stringFirst) {
        return new object.String(left.Value + right.Inspect());
    } else {
        return new object.String(left.Inspect() + right.Value);
    }
}
function evalBooleanInfixExpression(operator, left, right) {
    var leftVal = left.Value,
        rightVal = right.Value;
    switch (operator) {
        case "&&":
            return new object.Boolean(leftVal && rightVal);
        case "||":
            return new object.Boolean(leftVal || rightVal);
        default:
            return newError("unknown operator: %s %s %s", left.Type(), operator, right.Type());
    }
}
function evalIntegerInfixExpression(operator, left, right) {
    var leftVal = left.Value,
        rightVal = right.Value;
    switch (operator) {
        case "+":
            return new object.Integer(leftVal + rightVal);
        case "-":
            return new object.Integer(leftVal - rightVal);
        case "*":
            return new object.Integer(leftVal * rightVal);
        case "/":
            return new object.Integer(leftVal / rightVal);
        case "%":
            return new object.Integer(leftVal % rightVal);
        case "<":
            return nativeBoolToBooleanEObject(leftVal < rightVal);
        case ">":
            return nativeBoolToBooleanEObject(leftVal > rightVal);
        case "==":
            return nativeBoolToBooleanEObject(leftVal == rightVal);
        case "!=":
            return nativeBoolToBooleanEObject(leftVal != rightVal);
        default:
            return newError("unknown operator: %s %s %s", left.Type(), operator, right.Type());
    }
}
function evalFloatInfixExpression(operator, left, right) {
    var leftVal = left.Value,
        rightVal = right.Value;
    switch (operator) {
        case "+":
            return new object.Float(leftVal + rightVal);
        case "-":
            return new object.Float(leftVal - rightVal);
        case "*":
            return new object.Float(leftVal * rightVal);
        case "/":
            return new object.Float(leftVal / rightVal);
        case "%":
            return new object.Float(leftVal % rightVal);
        case "<":
            return nativeBoolToBooleanEObject(leftVal < rightVal);
        case ">":
            return nativeBoolToBooleanEObject(leftVal > rightVal);
        case "==":
            return nativeBoolToBooleanEObject(leftVal == rightVal);
        case "!=":
            return nativeBoolToBooleanEObject(leftVal != rightVal);
        default:
            return newError("unknown operator: %s %s %s", left.Type(), operator, right.Type());
    }
}
function evalStringInfixExpression(operator, left, right) {
    var leftVal = left.Value,
        rightVal = right.Value;
    switch (operator) {
        case "+":
            return new object.String(leftVal + rightVal);
        case "*":
            return new object.String(leftVal.repeat(rightVal.length));
        case "==":
            return nativeBoolToBooleanEObject(leftVal == rightVal);
        case "!=":
            return nativeBoolToBooleanEObject(leftVal != rightVal);
        case "<":
            return nativeBoolToBooleanEObject(leftVal < rightVal);
        case ">":
            return nativeBoolToBooleanEObject(leftVal > rightVal);
        default:
            return newError("unknown operator: %s %s %s", left.Type(), operator, right.Type());
    }
}
function evalNewExpression(ne, env, objectContext) {
    var classData = evalIdentifier(ne.Name, env, objectContext);
    if (classData.Type() != object.HASH_OBJ) {
        return newError("new operator can only be used with Class or Hashmap. Invalid type: " + classData.Type());
    }
    var instance = util_1.copyHashMap(classData);
    if (instance.Constructor == null && instance.Pairs[ne.Name.Value] != null) {
        instance.Constructor = instance.Pairs[ne.Name.Value].Value;
        instance.className = ne.Name.Value;
        bindContextToMethods(instance);
        // if (instance.Pairs.builtin && instance.Pairs.builtin.Value) {
        // 	extendBuiltinMethodEnvs(instance);
        // }
    }
    return instance;
}
function bindContextToMethods(instance) {
    var pairs = instance.Pairs;
    for (var p in pairs) {
        var pairType = pairs[p].Value.Type();
        if (pairType == object.BUILTIN_OBJ || pairType == object.FUNCTION_OBJ) {
            pairs[p].Value.ObjectContext = instance;
        }
    }
}
// function extendBuiltinMethodEnvs(instance: object.Hash) {
// 	const pairs = instance.Pairs;
// 	for (let p in pairs) {
// 		if (pairs[p].Value.Type() == object.BUILTIN_OBJ) {
// 			(<object.Builtin>pairs[p].Value).ObjectContext = instance;
// 		}
// 	}
// }
function evalExecExpression(se, env, objectContext) {
    var path = se.Name.String();
    if (path.length == 0) {
        return newError("path can't be empty");
    }
    util_1.getSourceFile(path, file_1.readWholeFile).then(function (data) {
        embeddedInterpreter.parseAndEvaluate(data, env, function (errors) {
            console.log("source errors:", errors);
            console.log(newError("source failed. "));
        });
    }).catch(function (err) {
        console.log(err);
    });
    return NULL;
}
function evalIfExpression(ie, env, objectContext) {
    var condition = Eval(ie.Condition, env, objectContext);
    if (isError(condition)) {
        return condition;
    }
    if (isTruthy(condition)) {
        return Eval(ie.Consequence, env, objectContext);
    } else if (ie.Alternative != null) {
        return Eval(ie.Alternative, env, objectContext);
    } else {
        return NULL;
    }
}
function evalForExpression(fl, env, objectContext) {
    var range = Eval(fl.Range, env, objectContext),
        element = fl.Element.Value,
        rangeType,
        key = "",
        keys,
        index = 0,
        indexObj = new object.Integer(index),
        length = 0;
    if (isError(range)) {
        return range;
    }
    rangeType = range.Type();
    var err, result;
    if (rangeType == object_1.INTEGER_OBJ) {
        length = range.Value;
        while (index < length) {
            indexObj.Value = index;
            env.set(element, indexObj);
            result = Eval(fl.Consequence, env, objectContext);
            err = err || isError(result) ? result : null;
            index += 1;
        }
    } else if (rangeType == object.ARRAY_OBJ) {
        length = range.Elements.length;
        while (index < length) {
            indexObj.Value = index;
            env.set(element, indexObj);
            result = Eval(fl.Consequence, env, objectContext);
            err = err || isError(result) ? result : null;
            index += 1;
        }
    } else if (rangeType == object.STRING_OBJ) {
        length = range.Value.length;
        while (index < length) {
            indexObj.Value = index;
            env.set(element, indexObj);
            result = Eval(fl.Consequence, env, objectContext);
            err = err || isError(result) ? result : null;
            index += 1;
        }
    } else if (rangeType == object.HASH_OBJ) {
        var keys_1 = Object.keys(range.Pairs);
        length = keys_1.length;
        while (index < length) {
            env.set(element, new object.String(keys_1[index]));
            result = Eval(fl.Consequence, env, objectContext);
            err = err || isError(result) ? result : null;
            index += 1;
        }
        if (err != null) {
            return newError("error in for loop %s", JSON.stringify(err));
        }
    } else {
        return newError("unknown range type in for loop: %s", range.Type());
    }
    return NULL;
}
function evalWhileExpression(ie, env, objectContext) {
    var condition = Eval(ie.Condition, env);
    if (isError(condition)) {
        return condition;
    }
    while (isTruthy(condition)) {
        Eval(ie.Consequence, env, objectContext);
        condition = Eval(ie.Condition, env, objectContext);
    }
    return NULL;
}
function evalSleepExpression(se, env, objectContext) {
    var duration = Eval(se.Duration, env);
    if (isError(duration)) {
        return duration;
    }
    setTimeout(function () {
        Eval(se.Consequence, env, objectContext);
    }, duration.Inspect());
    return NULL;
}
function evalIndexExpression(left, index, objectContext) {
    var indexExpType = left.Type() == object.ARRAY_OBJ && index.Type() == object_1.INTEGER_OBJ ? "arrayIndex" : "default";
    indexExpType = left.Type() == object.HASH_OBJ ? "hashIndex" : indexExpType;
    indexExpType = left.Type() == object.STRING_OBJ ? "stringIndex" : indexExpType;
    switch (indexExpType) {
        case "arrayIndex":
            return evalArrayIndexExpression(left, index);
        case "hashIndex":
            return evalHashIndexExpression(left, index, objectContext);
        case "stringIndex":
            return evalStringIndexExpression(left, index);
        default:
            return newError("index operator not supported: %s", left.Type());
    }
}
function evalArrayIndexExpression(array, index) {
    var arrayEObject = array,
        idx = index.Value,
        max = arrayEObject.Elements.length - 1;
    if (idx < 0 || idx > max) {
        return NULL;
    }
    return arrayEObject.Elements[idx];
}
function evalHashIndexExpression(hash, index, objectContext) {
    var hashObject = hash,
        ok = index.HashKey,
        key = null;
    if (!ok) {
        return newError("unusable as hash key: %s", index.Type());
    } else {
        key = index.HashKey();
    }
    var pair = hashObject.Pairs[key];
    ok = pair != null;
    if (!ok) {
        return NULL;
    }
    if (!objectContext && pair.modifiers && pair.modifiers.indexOf(0) > -1) {
        return newError("cannot access private field: %s", index.Inspect());
    }
    return pair.Value;
}
function evalStringIndexExpression(array, index) {
    var stringObject = array,
        idx = index.Value,
        max = stringObject.Value.length - 1;
    if (idx < 0 || idx > max) {
        return NULL;
    }
    return new object.String(stringObject.Value[idx]);
}
function evalIndexAssignmentExpression(left, index, assignment, objectContext) {
    var indexExpType = left.Type() == object.ARRAY_OBJ && index.Type() == object_1.INTEGER_OBJ ? "arrayIndex" : "default";
    indexExpType = left.Type() == object.HASH_OBJ ? "hashIndex" : indexExpType;
    indexExpType = left.Type() == object.STRING_OBJ ? "stringIndex" : indexExpType;
    switch (indexExpType) {
        case "arrayIndex":
            return evalArrayIndexAssignment(left, index, assignment);
        case "hashIndex":
            return evalHashIndexAssignment(left, index, assignment, objectContext);
        case "stringIndex":
            return evalStringIndexAssignment(left, index, assignment);
        default:
            return newError("index operator not supported: %s", left.Type());
    }
}
function evalStringIndexAssignment(str, index, assignment) {
    var stringObject = str,
        idx = index.Value,
        max = stringObject.Value.length - 1;
    if (idx < 0 || idx > max) {
        return NULL;
    }
    var oldStr = stringObject.Value,
        left = oldStr.substr(0, idx),
        right = oldStr.substr(idx + 1, oldStr.length - 1);
    stringObject.Value = left + assignment.Inspect() + right;
    return NULL;
}
function evalArrayIndexAssignment(array, index, assignment) {
    var arrayEObject = array,
        idx = index.Value,
        max = arrayEObject.Elements.length - 1;
    if (idx < 0 || idx > max) {
        return NULL;
    }
    arrayEObject.Elements[idx] = assignment;
    return NULL;
}
function evalHashIndexAssignment(hash, index, assignment, objectContext) {
    var hashObject = hash,
        ok = index.Value,
        key = null;
    if (!ok) {
        return newError("unusable as hash key: %s", index.Type());
    } else {
        key = index.Value;
    }
    var pair = hashObject.Pairs[key];
    ok = pair != null;
    if (!ok) {
        return NULL;
    }
    if (pair.modifiers) {
        if (!objectContext && pair.modifiers.indexOf(0) > -1) {
            return newError("cannot access private field: %s", index.Inspect());
        }
        if (pair.modifiers.indexOf(2) > -1) {
            return newError("cannot modify final field: %s", index.Inspect());
        }
    }
    pair.Value = assignment;
    return NULL;
}
function evalIdentifier(node, env, objectContext) {
    var name = node.Value;
    if (name == "this") {
        if (objectContext != null) {
            return objectContext;
        }
        return newError("statement has no object context");
    } else {
        var ident = env.get(name);
        if (ident != null) {
            return ident;
        }
        var builtin = builtins_1.builtins[name];
        if (builtin != null && builtin != undefined) {
            return builtin;
        }
        return newError("identifier not found: %s", name);
    }
}
function evalHashLiteral(node, env) {
    var hashmap = new object.Hash({}),
        pairs = {};
    node.Pairs.forEach(function (valueNode, keyNode) {
        var key = Eval(keyNode, env),
            // pass object context here
        value,
            hashPair;
        if (isError(key)) {
            return key;
        }
        if (!key.HashKey) {
            return newError("unusable as hash key: %s", key.Type());
        }
        value = Eval(valueNode, env, hashmap);
        if (isError(value)) {
            return value;
        }
        hashPair = { Key: key, Value: value };
        if (keyNode.modifiers != null) {
            hashPair.modifiers = keyNode.modifiers;
        }
        pairs[key.HashKey()] = hashPair;
    });
    hashmap.Pairs = pairs;
    return hashmap;
}
function evalBangOperatorExpression(right) {
    switch (right) {
        case TRUE:
            return FALSE;
        case FALSE:
            return TRUE;
        case NULL:
            return TRUE;
        default:
            return FALSE;
    }
}
function evalMinusPrefixOperatorExpression(right) {
    if (right.Type() != object_1.INTEGER_OBJ) {
        return newError("unknown operator: -%s", right.Type());
    }
    var value = right.Value;
    return new object.Integer(-value);
}
function applyFunction(fn, env, args, objectContext) {
    var fnType = fn.Type();
    var extendedEnv, evaluated;
    switch (fnType) {
        case "function":
            extendedEnv = extendFunctionEnv(fn, args), evaluated = Eval(fn.Body, extendedEnv, fn.ObjectContext);
            return unwrapReturnValue(evaluated);
        case "hash":
            var constructor = fn.Constructor;
            if (!constructor) {
                return newError("object has no constructor");
            }
            if (constructor.Parameters) {
                // Function Literal constructor
                extendedEnv = extendFunctionEnv(constructor, args);
                evaluated = Eval(constructor.Body, extendedEnv, fn);
            } else {
                //                      Builtin Function Constructor
                evaluated = applyBuiltinFunction(constructor, args, env, fn);
            }
            return fn;
        case "BUILTIN":
            return applyBuiltinFunction(fn, args, env, objectContext);
        default:
            return newError("not a function: %s", fn.Type());
    }
}
exports.applyFunction = applyFunction;
function applyBuiltinFunction(fn, args, env, objectContext) {
    var contextName = fn.Context,
        context = null,
        scope = null;
    if (contextName) {
        context = env.context;
    }
    if (fn.ObjectContext) {
        scope = fn.ObjectContext;
    } else if (context) {
        scope = context.data[contextName];
    }
    return fn.Fn.apply(fn, [context, scope].concat(args));
}
function extendFunctionEnv(fn, args) {
    var env = environment.NewEnclosedEnvironment(fn.Env),
        paramIdx = 0,
        param = null,
        nParams = fn.Parameters.length;
    while (paramIdx < nParams) {
        param = fn.Parameters[paramIdx];
        env.set(param.Value, args[paramIdx]);
        paramIdx += 1;
    }
    return env;
}
function unwrapReturnValue(obj) {
    if (!obj || !obj.Type) {
        return NULL;
    }
    if (obj.Type() == object.RETURN_VALUE_OBJ) {
        return obj.Value;
    }
    return obj;
}
function isError(obj) {
    if (obj != null) {
        return !!obj.Message; //obj.Type() == object.ERROR_OBJ
    }
    return false;
}
function isTruthy(obj) {
    return obj && obj.Value != null ? !!obj.Value : true;
}

},{"./builtins":16,"./builtins/io/file":17,"./object":28,"./object/environment":27,"./util":37,"fs":3}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var token = require("./token");
var Lexer = /** @class */function () {
    function Lexer() {
        this.position = 0;
        this.readPosition = 0;
        this.ch = "";
    }
    Lexer.prototype.setText = function (input) {
        this.position = 0;
        this.readPosition = 0;
        this.ch = "";
        this.input = input;
    };
    Lexer.prototype.NextToken = function () {
        var tok = {},
            peek = "",
            num;
        this.skipWhitespace();
        switch (this.ch) {
            case '=':
                peek = this.peekChar();
                if (peek == '=') {
                    tok.Literal = this.ch + peek;
                    tok.Type = token.EQ;
                    this.readChar();
                } else {
                    tok = newToken(token.ASSIGN, this.ch);
                }
                break;
            case '&':
                peek = this.peekChar();
                if (peek == '&') {
                    this.readChar();
                }
                tok = newToken(token.AND, this.ch + '&');
                break;
            case '|':
                peek = this.peekChar();
                if (peek == '|') {
                    this.readChar();
                }
                tok = newToken(token.OR, this.ch + '|');
                break;
            case '.':
                tok = newToken(token.DOT, this.ch);
                break;
            case '+':
                tok = newToken(token.PLUS, this.ch);
                break;
            case ',':
                tok = newToken(token.COMMA, this.ch);
                break;
            case ';':
                tok = newToken(token.SEMICOLON, this.ch);
                break;
            case ':':
                tok = newToken(token.COLON, this.ch);
                break;
            case '(':
                tok = newToken(token.LPAREN, this.ch);
                break;
            case ')':
                tok = newToken(token.RPAREN, this.ch);
                break;
            case '{':
                tok = newToken(token.LBRACE, this.ch);
                break;
            case '}':
                tok = newToken(token.RBRACE, this.ch);
                break;
            case '[':
                tok = newToken(token.LBRACKET, this.ch);
                break;
            case ']':
                tok = newToken(token.RBRACKET, this.ch);
                break;
            case '!':
                peek = this.peekChar();
                if (peek == '=') {
                    tok.Literal = this.ch + peek;
                    tok.Type = token.NOT_EQ;
                    this.readChar();
                } else {
                    tok = newToken(token.BANG, this.ch);
                }
                break;
            case '-':
                tok = newToken(token.MINUS, this.ch);
                break;
            case '/':
                if (this.peekChar() == '*') {
                    tok = newToken(token.LCOMMENT, this.ch + '*');
                    this.readChar();
                    break;
                } else {
                    tok = newToken(token.SLASH, this.ch);
                    break;
                }
            case '*':
                if (this.peekChar() == '/') {
                    tok = newToken(token.RCOMMENT, this.ch + '/');
                    this.readChar();
                } else {
                    tok = newToken(token.ASTERISK, this.ch);
                }
                break;
            case '%':
                tok = newToken(token.MOD, this.ch);
                break;
            case '<':
                tok = newToken(token.LT, this.ch);
                break;
            case '>':
                tok = newToken(token.GT, this.ch);
                break;
            case '"':
                tok.Type = token.STRING;
                tok.Literal = this.readString();
                break;
            case 'Ω':
                tok.Literal = "Ω";
                tok.Type = token.EOF;
                break;
            default:
                if (isLetter(this.ch)) {
                    tok.Literal = this.readIdentifier();
                    tok.Type = token.LookupIdent(tok.Literal);
                    return tok;
                } else if (isDigit(this.ch)) {
                    num = this.readNumber();
                    tok.Literal = num[1];
                    tok.Type = num[0] ? token.FLOAT : token.INT;
                    return tok;
                } else {
                    tok = newToken(token.ILLEGAL, this.ch);
                }
        }
        this.readChar();
        return tok;
    };
    Lexer.prototype.getInputLength = function () {
        return this.input.length;
    };
    Lexer.prototype.skipWhitespace = function () {
        while (this.ch == ' ' || this.ch == '\t' || this.ch == '\n' || this.ch == '\r') {
            this.readChar();
        }
    };
    Lexer.prototype.peekChar = function () {
        if (this.readPosition == this.input.length) {
            return 'Ω';
        } else {
            return this.input[this.readPosition];
        }
    };
    Lexer.prototype.readChar = function () {
        this.ch = this.peekChar();
        this.position = this.readPosition;
        this.readPosition += 1;
    };
    Lexer.prototype.readIdentifier = function () {
        var position = this.position;
        if (isLetter(this.ch)) {
            this.readChar();
        }
        while (isLetter(this.ch) || isWholeDigit(this.ch)) {
            this.readChar();
        }
        return this.input.substring(position, this.position);
    };
    Lexer.prototype.readNumber = function () {
        var position = this.position,
            float = false;
        while (isDigit(this.ch)) {
            if (this.ch == ".") {
                float = true;
            }
            this.readChar();
        }
        return [float, this.input.substring(position, this.position)];
    };
    Lexer.prototype.readString = function () {
        var position = this.position + 1;
        while (true) {
            this.readChar();
            if (this.ch == '"') {
                break;
            }
        }
        return this.input.substring(position, this.position);
    };
    return Lexer;
}();
exports.Lexer = Lexer;
function isWholeDigit(ch) {
    return '0' <= ch && ch <= '9';
}
exports.isWholeDigit = isWholeDigit;
function isDigit(ch) {
    return '0' <= ch && ch <= '9' || ch == '.';
}
exports.isDigit = isDigit;
function isLetter(ch) {
    return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || ch == '_' || ch && ch.charCodeAt(0) > 200;
}
exports.isLetter = isLetter;
function newToken(tokenType, ch) {
    return { Type: tokenType, Literal: ch };
}
exports.newToken = newToken;

},{"./token":36}],27:[function(require,module,exports){
"use strict";

var __assign = undefined && undefined.__assign || Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) {
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Environment = /** @class */function () {
    function Environment(outer, context, worker) {
        if (outer === void 0) {
            outer = null;
        }
        if (context === void 0) {
            context = null;
        }
        if (worker === void 0) {
            worker = null;
        }
        this.outer = null;
        this.context = null;
        this.store = {}; //new Map<string, any>();
        this.outer = outer;
        if (context) {
            if (this.context) {
                context.data = __assign({}, this.context.data, context.data);
            }
            this.context = context;
        }
    }
    Environment.prototype.get = function (name) {
        var ok = true,
            value = null;
        value = this.store[name];
        ok = value != null;
        if (!ok && this.outer != null) {
            value = this.outer.get(name);
        }
        return value;
    };
    Environment.prototype.set = function (name, value) {
        this.store[name] = value; //.set(name, value);
        return value;
    };
    Environment.prototype.setContext = function (name, value) {
        this.context[name] = value;
    };
    return Environment;
}();
exports.Environment = Environment;
function NewEnclosedEnvironment(outer) {
    return new Environment(outer);
}
exports.NewEnclosedEnvironment = NewEnclosedEnvironment;

},{}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var token_1 = require("../token");
var INTEGER_OBJ = "int",
    FLOAT_OBJ = "float",
    BOOLEAN_OBJ = "boolean",
    NULL_OBJ = "null",
    RETURN_VALUE_OBJ = "RETURN_VALUE",
    ERROR_OBJ = "error",
    FUNCTION_OBJ = "function",
    STRING_OBJ = "string",
    BUILTIN_OBJ = "BUILTIN",
    ARRAY_OBJ = "array",
    HASH_OBJ = "hash";
exports.INTEGER_OBJ = INTEGER_OBJ;
exports.FLOAT_OBJ = FLOAT_OBJ;
exports.BOOLEAN_OBJ = BOOLEAN_OBJ;
exports.NULL_OBJ = NULL_OBJ;
exports.RETURN_VALUE_OBJ = RETURN_VALUE_OBJ;
exports.ERROR_OBJ = ERROR_OBJ;
exports.FUNCTION_OBJ = FUNCTION_OBJ;
exports.STRING_OBJ = STRING_OBJ;
exports.BUILTIN_OBJ = BUILTIN_OBJ;
exports.ARRAY_OBJ = ARRAY_OBJ;
exports.HASH_OBJ = HASH_OBJ;
var NULL = /** @class */function () {
    function NULL() {}
    NULL.prototype.Type = function () {
        return NULL_OBJ;
    };
    NULL.prototype.Inspect = function () {
        return null;
    };
    return NULL;
}();
exports.NULL = NULL;
var Integer = /** @class */function () {
    function Integer(Value) {
        this.Value = Value;
    }
    Integer.prototype.Inspect = function () {
        return this.Value;
    };
    Integer.prototype.Type = function () {
        return INTEGER_OBJ;
    };
    Integer.prototype.HashKey = function () {
        return "" + this.Value;
    };
    return Integer;
}();
exports.Integer = Integer;
var Float = /** @class */function () {
    function Float(Value) {
        this.Value = Value;
    }
    Float.prototype.Inspect = function () {
        return this.Value;
    };
    Float.prototype.Type = function () {
        return FLOAT_OBJ;
    };
    Float.prototype.HashKey = function () {
        return "" + this.Value;
    };
    return Float;
}();
exports.Float = Float;
var Boolean = /** @class */function () {
    function Boolean(Value) {
        this.Value = Value;
    }
    Boolean.prototype.Type = function () {
        return BOOLEAN_OBJ;
    };
    Boolean.prototype.Inspect = function () {
        return this.Value;
    };
    Boolean.prototype.HashKey = function () {
        return "" + (this.Value ? 1 : 0);
    };
    return Boolean;
}();
exports.Boolean = Boolean;
var ReturnValue = /** @class */function () {
    function ReturnValue(Value) {
        this.Value = Value;
    }
    ReturnValue.prototype.Type = function () {
        return RETURN_VALUE_OBJ;
    };
    ReturnValue.prototype.Inspect = function () {
        return this.Value.Inspect();
    };
    return ReturnValue;
}();
exports.ReturnValue = ReturnValue;
var Function = /** @class */function () {
    function Function(Parameters, Body, Env, Fn, ObjectContext) {
        this.Parameters = Parameters;
        this.Body = Body;
        this.Env = Env;
        this.Fn = Fn;
        this.ObjectContext = ObjectContext;
    }
    Function.prototype.Type = function () {
        return FUNCTION_OBJ;
    };
    Function.prototype.Inspect = function (indentLevel) {
        if (indentLevel === void 0) {
            indentLevel = 1;
        }
        var out = "",
            params = [];
        for (var _i = 0, _a = this.Parameters; _i < _a.length; _i++) {
            var p = _a[_i];
            params.push(p.String());
        }
        if (this.ObjectContext && this.ObjectContext.className) {
            out += "{" + this.ObjectContext.className + "} ";
        }
        var indentation = "    ".repeat(indentLevel),
            outerIndentation = "    ".repeat(indentLevel - 1);
        out += "fn(" + params.join(", ") + ")";
        var body = this.Body.String().split("\n").map(function (v) {
            return indentation + v;
        }).join("\n");
        out += this.Body.Statements.length > 0 ? "\n" + outerIndentation + "{\n" + body + "\n" + outerIndentation + "}" : "{}";
        return out;
    };
    return Function;
}();
exports.Function = Function;
var String = /** @class */function () {
    function String(Value) {
        this.Value = Value;
    }
    String.prototype.Type = function () {
        return STRING_OBJ;
    };
    String.prototype.Inspect = function () {
        return this.Value;
    };
    String.prototype.HashKey = function () {
        return "" + this.Value.substr(0, 16);
    };
    return String;
}();
exports.String = String;
var Array = /** @class */function () {
    function Array(Elements) {
        this.Elements = Elements;
    }
    Array.prototype.Type = function () {
        return ARRAY_OBJ;
    };
    Array.prototype.Inspect = function () {
        var out = "",
            elements = [];
        this.Elements.forEach(function (e) {
            elements.push(e.Inspect ? e.Inspect() : null);
        });
        var tableMode = this.Elements.length > 0 && this.Elements[0].Type() == STRING_OBJ && this.Elements[0].Value.length > 16;
        out += "[" + (tableMode ? "\n" : "");
        out += (tableMode ? "     " : "") + elements.join(tableMode ? ",\n     " : ", ");
        out += (tableMode ? "\n" : "") + "]";
        return out;
    };
    return Array;
}();
exports.Array = Array;
var Error = /** @class */function () {
    function Error(Message) {
        this.Message = Message;
    }
    Error.prototype.Type = function () {
        return ERROR_OBJ;
    };
    Error.prototype.Inspect = function () {
        return "💀  RUNTIME ERROR: " + this.Message;
    };
    return Error;
}();
exports.Error = Error;
var Builtin = /** @class */function () {
    function Builtin(Fn, Context, ObjectContext) {
        this.Fn = Fn;
        this.Context = Context;
        this.ObjectContext = ObjectContext;
    }
    Builtin.prototype.Type = function () {
        return BUILTIN_OBJ;
    };
    Builtin.prototype.Inspect = function (indentLevel) {
        return "builtin function";
    };
    return Builtin;
}();
exports.Builtin = Builtin;
var Hash = /** @class */function () {
    function Hash(Pairs, Constructor, className, builtins) {
        if (builtins === void 0) {
            builtins = {};
        }
        this.Pairs = Pairs;
        this.Constructor = Constructor;
        this.className = className;
        this.builtins = builtins;
    }
    Hash.prototype.Type = function () {
        return HASH_OBJ;
    };
    Hash.prototype.Inspect = function (indentLevel) {
        var _this = this;
        if (indentLevel === void 0) {
            indentLevel = 1;
        }
        var out = "";
        out += this.className ? this.className + " " : "";
        out += "{\n";
        Object.keys(this.Pairs).forEach(function (key) {
            var pair = _this.Pairs[key];
            out += "    ".repeat(indentLevel) + (pair.modifiers ? pair.modifiers.map(function (m) {
                return token_1.modifierNames[m] + " ";
            }) : "") + key + ": " + pair.Value.Inspect(indentLevel + 1) + "\n";
        });
        out += "}";
        return out;
    };
    return Hash;
}();
exports.Hash = Hash;

},{"../token":36}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _a;
var token = require("./token");
var token_1 = require("./token");
var ast = require("./ast");
var statement = require("./ast/statements");
var expressions = require("./ast/expressions");
var literal = require("./ast/literals");
var util_1 = require("./util");
exports.LOWEST = 0, exports.LOGICAL = 1, exports.EQUALS = 2, exports.LESSGREATER = 3, exports.SUM = 4, exports.PRODUCT = 5, exports.PREFIX = 6, exports.CALL = 7, exports.INDEX = 8;
exports.precedences = (_a = {},
// Map<token.TokenType, number> = new Map([
_a[token.EQ] = exports.EQUALS, _a[token.NOT_EQ] = exports.EQUALS, _a[token.AND] = exports.LOGICAL, _a[token.OR] = exports.LOGICAL, _a[token.TYPEOF] = exports.LESSGREATER, _a[token.LT] = exports.LESSGREATER, _a[token.GT] = exports.LESSGREATER, _a[token.PLUS] = exports.SUM, _a[token.MINUS] = exports.SUM, _a[token.SLASH] = exports.PRODUCT, _a[token.ASTERISK] = exports.PRODUCT, _a[token.MOD] = exports.PRODUCT, _a[token.DOT] = exports.INDEX, _a[token.LPAREN] = exports.CALL, _a[token.LBRACKET] = exports.INDEX, _a);
var Parser = /** @class */function () {
    function Parser(l) {
        var _this = this;
        this.curToken = null;
        this.peekToken = null;
        this.prefixParseFns = {};
        this.infixParseFns = {};
        /**
         * parseExpression
         * @argument {number} precedence
         * @argument {boolean} identAsString
         * @returns {expressions.Expression}
         */
        this.parseExpression = function (precedence, identAsString) {
            if (identAsString === void 0) {
                identAsString = false;
            }
            var curTokenType = _this.curToken.Type;
            var prefix = _this.prefixParseFns[curTokenType],
                leftExp;
            if (prefix == null) {
                _this.noPrefixParseFnError(curTokenType);
                return null;
            }
            if (identAsString && curTokenType === "IDENT") {
                prefix = _this.parseStringLiteral;
            }
            leftExp = prefix();
            while (!_this.peekTokenIs(token.SEMICOLON) && precedence < _this.peekPrecedence()) {
                var infix = _this.infixParseFns[_this.peekToken.Type];
                if (infix == null) {
                    return leftExp;
                }
                _this.nextToken();
                leftExp = infix(leftExp);
            }
            return leftExp;
        };
        /**
         * parseExpressionWithModifiers
         * @argument {number} precedence
         *
         * handles prefixes private, static and final
         */
        this.parseExpressionWithModifiers = function (precedence) {
            var prefix,
                leftExp,
                modifiers = [],
                modifier = -1;
            modifier = token_1.modifierTypes.indexOf(_this.curToken.Type);
            while (modifier > -1) {
                modifiers.push(modifier);
                _this.nextToken();
                modifier = token_1.modifierTypes.indexOf(_this.curToken.Type);
            }
            var curTokenType = _this.curToken.Type;
            prefix = _this.prefixParseFns[curTokenType];
            if (prefix == null) {
                _this.noPrefixParseFnError(curTokenType);
                return null;
            }
            if (curTokenType === "IDENT") {
                prefix = _this.parseStringLiteral;
                leftExp = prefix();
                if (modifiers.length > 0) {
                    leftExp.modifiers = modifiers;
                }
            } else {
                leftExp = prefix();
            }
            while (!_this.peekTokenIs(token.SEMICOLON) && precedence < _this.peekPrecedence()) {
                var infix = _this.infixParseFns[_this.peekToken.Type];
                if (infix == null) {
                    return leftExp;
                }
                _this.nextToken();
                leftExp = infix(leftExp);
            }
            return leftExp;
        };
        this.parsePrefixExpression = function () {
            var expression = new expressions.PrefixExpression(_this.curToken, _this.curToken.Literal);
            _this.nextToken();
            expression.Right = _this.parseExpression(exports.PREFIX);
            return expression;
        };
        this.parseInfixExpression = function (left) {
            var expression = new expressions.InfixExpression(_this.curToken, left, _this.curToken.Literal),
                precedence = _this.curPrecedence();
            _this.nextToken();
            expression.Right = _this.parseExpression(precedence);
            return expression;
        };
        this.parseIfExpression = function () {
            var expression = new expressions.IfExpression(_this.curToken);
            if (!_this.expectPeek(token.LPAREN)) {
                return null;
            }
            _this.nextToken();
            expression.Condition = _this.parseExpression(exports.LOWEST);
            if (!_this.expectPeek(token.RPAREN)) {
                return null;
            }
            if (!_this.expectPeek(token.LBRACE)) {
                return null;
            }
            expression.Consequence = _this.parseBlockStatement();
            if (_this.peekTokenIs(token.ELSE)) {
                _this.nextToken();
                if (!_this.expectPeek(token.LBRACE)) {
                    return null;
                }
                expression.Alternative = _this.parseBlockStatement();
            }
            return expression;
        };
        this.parseForExpression = function () {
            var expression = new expressions.ForExpression(_this.curToken);
            if (!_this.expectPeek(token.LPAREN)) {
                return null;
            }
            if (!_this.expectPeek(token.IDENT)) {
                return null;
            }
            expression.Element = new literal.Identifier(_this.curToken, _this.curToken.Literal);
            if (!_this.expectPeek(token.COMMA)) {
                return null;
            }
            _this.nextToken();
            expression.Range = _this.parseExpression(exports.LOWEST);
            if (!_this.expectPeek(token.RPAREN)) {
                return null;
            }
            if (!_this.expectPeek(token.LBRACE)) {
                return null;
            }
            expression.Consequence = _this.parseBlockStatement();
            return expression;
        };
        this.parseWhileExpression = function () {
            var expression = new expressions.WhileExpression(_this.curToken);
            if (!_this.expectPeek(token.LPAREN)) {
                return null;
            }
            _this.nextToken();
            expression.Condition = _this.parseExpression(exports.LOWEST);
            if (!_this.expectPeek(token.RPAREN)) {
                return null;
            }
            if (!_this.expectPeek(token.LBRACE)) {
                return null;
            }
            expression.Consequence = _this.parseBlockStatement();
            return expression;
        };
        this.parseSleepExpression = function () {
            var expression = new expressions.SleepExpression(_this.curToken);
            if (!_this.expectPeek(token.LPAREN)) {
                return null;
            }
            _this.nextToken();
            expression.Duration = _this.parseExpression(exports.LOWEST);
            if (!_this.expectPeek(token.RPAREN)) {
                return null;
            }
            if (!_this.expectPeek(token.LBRACE)) {
                return null;
            }
            expression.Consequence = _this.parseBlockStatement();
            return expression;
        };
        this.parseGroupedExpression = function () {
            _this.nextToken();
            var exp = _this.parseExpression(exports.LOWEST);
            if (!_this.expectPeek(token.RPAREN)) {
                return null;
            }
            return exp;
        };
        this.parseCallExpression = function (fun) {
            var curToken = _this.curToken,
                exp = new expressions.CallExpression(curToken, fun);
            exp.Arguments = _this.parseExpressionList(token.RPAREN);
            return exp;
        };
        this.parseIndexExpression = function (left) {
            var exp = null;
            var bracketAndLeft = [_this.curToken, left];
            _this.nextToken();
            var Index = _this.parseExpression(exports.LOWEST);
            if (!_this.expectPeek(token.RBRACKET)) {
                return null;
            }
            if (!_this.peekTokenIs(token.ASSIGN)) {
                exp = new expressions.IndexExpression(bracketAndLeft[0], bracketAndLeft[1]);
            } else {
                exp = new expressions.IndexAssignmentExpression(bracketAndLeft[0], bracketAndLeft[1]);
                _this.nextToken();
                _this.nextToken();
                exp.Assignment = _this.parseExpression(exports.LOWEST);
            }
            exp.Index = Index;
            return exp;
        };
        this.parseDotIndexExpression = function (left) {
            var exp = null,
                Index = null;
            var bracketAndLeft = [_this.curToken, left];
            if (_this.peekTokenIs(token.IDENT)) {
                _this.nextToken();
                var identValue = _this.curToken.Literal;
                Index = new literal.StringLiteral({ Type: token.STRING, Literal: identValue }, identValue);
            } else {
                // this.nextToken()
                Index = _this.parseExpression(exports.LOWEST);
            }
            if (!_this.peekTokenIs(token.ASSIGN)) {
                exp = new expressions.IndexExpression(bracketAndLeft[0], bracketAndLeft[1]);
            } else {
                exp = new expressions.IndexAssignmentExpression(bracketAndLeft[0], bracketAndLeft[1]);
                _this.nextToken();
                _this.nextToken();
                exp.Assignment = _this.parseExpression(exports.LOWEST);
            }
            exp.Index = Index;
            return exp;
        };
        this.parseCallArguments = function () {
            var args = Array();
            if (_this.peekTokenIs(token.RPAREN)) {
                _this.nextToken();
                return args;
            }
            _this.nextToken();
            args.push(_this.parseExpression(exports.LOWEST));
            while (_this.peekTokenIs(token.COMMA)) {
                _this.nextToken();
                _this.nextToken();
                args.push(_this.parseExpression(exports.LOWEST));
            }
            if (!_this.expectPeek(token.RPAREN)) {
                return null;
            }
            return args;
        };
        this.parseCommentBlock = function () {
            var endComment = false;
            while (!endComment) {
                _this.nextToken();
                endComment = _this.curToken.Type === token.RCOMMENT;
            }
        };
        this.parseStatement = function () {
            if (_this.curToken.Type == token.IDENT && _this.peekTokenIs(token.ASSIGN)) {
                return _this.parseAssignmentStatement();
            }
            // case token.LBRACE:
            // 	return this.parseIndexAssignmentStatement();
            switch (_this.curToken.Type) {
                case token.LET:
                case token.LET_BOOL:
                case token.LET_INT:
                case token.LET_FLOAT:
                case token.LET_STRING:
                    return _this.parseLetStatement(_this.curToken.Type);
                case token.RETURN:
                    return _this.parseReturnStatement();
                case token.CLASS:
                    return _this.parseClassStatement();
                default:
                    return _this.parseExpressionStatement();
            }
        };
        this.parseExpressionStatement = function () {
            var curToken = _this.curToken;
            var stmt = new statement.ExpressionStatement(curToken);
            stmt.Expression = _this.parseExpression(exports.LOWEST);
            if (_this.peekTokenIs(token.SEMICOLON)) {
                _this.nextToken();
            }
            return stmt;
        };
        this.parseNewExpression = function () {
            var exp = new expressions.NewExpression(_this.curToken);
            if (!_this.expectPeek(token.IDENT)) {
                return null;
            }
            exp.Name = new literal.Identifier(_this.curToken, _this.curToken.Literal);
            return exp;
        };
        this.parseExecExpression = function () {
            var exp = new expressions.ExecExpression(_this.curToken);
            if (!_this.expectPeek(token.STRING)) {
                return null;
            }
            exp.Name = new literal.StringLiteral(_this.curToken, _this.curToken.Literal);
            return exp;
        };
        this.parseAssignmentStatement = function () {
            var stmt = new statement.AssignmentStatement(new literal.Identifier(_this.curToken, _this.curToken.Literal));
            if (!_this.expectPeek(token.ASSIGN)) {
                return null;
            }
            _this.nextToken();
            stmt.Value = _this.parseExpression(exports.LOWEST);
            if (_this.peekTokenIs(token.SEMICOLON)) {
                _this.nextToken();
            }
            return stmt;
        };
        this.parseLetStatement = function (dataType) {
            var stmt = new statement.LetStatement(_this.curToken);
            stmt.dataType = dataType;
            if (!_this.expectPeek(token.IDENT)) {
                return null;
            }
            stmt.Name = new literal.Identifier(_this.curToken, _this.curToken.Literal);
            if (!_this.expectPeek(token.ASSIGN)) {
                return null;
            }
            _this.nextToken();
            stmt.Value = _this.parseExpression(exports.LOWEST);
            if (_this.peekTokenIs(token.SEMICOLON)) {
                _this.nextToken();
            }
            if (_this.peekTokenIs(token.COMMA)) {
                var Name = void 0,
                    Value = void 0;
                stmt.Vars = [[stmt.Name, stmt.Value]];
                _this.nextToken();
                if (!_this.expectPeek(token.IDENT)) {
                    return null;
                }
                Name = new literal.Identifier(_this.curToken, _this.curToken.Literal);
                if (!_this.expectPeek(token.ASSIGN)) {
                    return null;
                }
                _this.nextToken();
                Value = _this.parseExpression(exports.LOWEST);
                stmt.Vars.push([Name, Value]);
                while (_this.peekTokenIs(token.COMMA)) {
                    _this.nextToken();
                    if (!_this.expectPeek(token.IDENT)) {
                        return null;
                    }
                    Name = new literal.Identifier(_this.curToken, _this.curToken.Literal);
                    if (!_this.expectPeek(token.ASSIGN)) {
                        return null;
                    }
                    _this.nextToken();
                    Value = _this.parseExpression(exports.LOWEST);
                    stmt.Vars.push([Name, Value]);
                }
                if (_this.peekTokenIs(token.SEMICOLON)) {
                    _this.nextToken();
                }
            }
            return stmt;
        };
        this.parseClassStatement = function () {
            var stmt = new statement.ClassStatement(_this.curToken);
            if (!_this.expectPeek(token.IDENT)) {
                return null;
            }
            stmt.Name = new literal.Identifier(_this.curToken, _this.curToken.Literal);
            _this.nextToken();
            stmt.Value = _this.parseHashLiteral(true);
            if (_this.peekTokenIs(token.SEMICOLON)) {
                _this.nextToken();
            }
            return stmt;
        };
        this.parseReturnStatement = function () {
            var stmt = new statement.ReturnStatement(_this.curToken);
            _this.nextToken();
            stmt.ReturnValue = _this.parseExpression(exports.LOWEST);
            if (_this.peekTokenIs(token.SEMICOLON)) {
                _this.nextToken();
            }
            return stmt;
        };
        this.parseBlockStatement = function () {
            var block = new statement.BlockStatement(_this.curToken);
            block.Statements = [];
            _this.nextToken();
            while (!_this.curTokenIs(token.RBRACE) && !_this.curTokenIs(token.EOF)) {
                var stmt = _this.parseStatement();
                if (stmt != null) {
                    block.Statements.push(stmt);
                }
                _this.nextToken();
            }
            return block;
        };
        this.parseIdentifier = function () {
            return new literal.Identifier(_this.curToken, _this.curToken.Literal);
        };
        this.parseBoolean = function () {
            return new literal.Boolean(_this.curToken, _this.curTokenIs(token.TRUE));
        };
        this.parseIntegerLiteral = function () {
            var curToken = _this.curToken;
            var lit = new literal.IntegerLiteral(curToken);
            var value = parseInt(_this.curToken.Literal);
            if (value == null || value == NaN) {
                _this.errors.push("could not parse " + _this.curToken.Literal + " as integer");
                return null;
            }
            lit.Value = value;
            return lit;
        };
        this.parseFloatLiteral = function () {
            var curToken = _this.curToken;
            var lit = new literal.FloatLiteral(curToken);
            var value = parseFloat(_this.curToken.Literal);
            if (value == null || value == NaN) {
                _this.errors.push("could not parse " + _this.curToken.Literal + " as float");
                return null;
            }
            lit.Value = value;
            return lit;
        };
        this.parseFunctionLiteral = function () {
            var curToken = _this.curToken,
                lit = new literal.FunctionLiteral(curToken);
            if (!_this.expectPeek(token.LPAREN)) {
                return null;
            }
            lit.Parameters = _this.parseFunctionParameters();
            if (!_this.expectPeek(token.LBRACE)) {
                return null;
            }
            lit.Body = _this.parseBlockStatement();
            return lit;
        };
        this.parseHashLiteral = function (exp, classMap) {
            if (classMap === void 0) {
                classMap = false;
            }
            var value = null,
                key = null,
                hash = new literal.HashLiteral(_this.curToken);
            hash.Pairs = new Map();
            while (!_this.peekTokenIs(token.RBRACE)) {
                _this.nextToken();
                // pass flag to parseExpression to parse identifiers as strings
                key = _this.parseExpressionWithModifiers(exports.LOWEST);
                if (!_this.expectPeek(token.COLON)) {
                    return null;
                }
                _this.nextToken();
                value = _this.parseExpression(exports.LOWEST);
                hash.Pairs.set(key, value);
                if (!_this.peekTokenIs(token.RBRACE) && !_this.expectPeek(token.COMMA)) {
                    return null;
                }
            }
            if (!_this.expectPeek(token.RBRACE)) {
                return null;
            }
            return hash;
        };
        this.parseStreamLiteral = function () {
            var curToken = _this.curToken,
                lit = new literal.StreamLiteral(curToken);
            if (!_this.expectPeek(token.LPAREN)) {
                return null;
            }
            lit.Emit = _this.parseIdentifier();
            if (!_this.expectPeek(token.LBRACE)) {
                return null;
            }
            lit.Body = _this.parseBlockStatement();
            return lit;
        };
        this.parseFunctionParameters = function () {
            var identifiers = [];
            if (_this.peekTokenIs(token.RPAREN)) {
                _this.nextToken();
                return identifiers;
            }
            _this.nextToken();
            var ident = new literal.Identifier(_this.curToken, _this.curToken.Literal);
            identifiers.push(ident);
            while (_this.peekTokenIs(token.COMMA)) {
                _this.nextToken();
                _this.nextToken();
                ident = new literal.Identifier(_this.curToken, _this.curToken.Literal);
                identifiers.push(ident);
            }
            if (!_this.expectPeek(token.RPAREN)) {
                return null;
            }
            return identifiers;
        };
        this.parseStringLiteral = function () {
            return new literal.StringLiteral(_this.curToken, _this.curToken.Literal);
        };
        this.parseArrayLiteral = function () {
            var array = new literal.ArrayLiteral(_this.curToken);
            array.Elements = _this.parseExpressionList(token.RBRACKET);
            return array;
        };
        this.parseExpressionList = function (end) {
            var list = [];
            if (_this.peekTokenIs(end)) {
                _this.nextToken();
                return list;
            }
            _this.nextToken();
            list.push(_this.parseExpression(exports.LOWEST));
            while (_this.peekTokenIs(token.COMMA)) {
                _this.nextToken();
                _this.nextToken();
                list.push(_this.parseExpression(exports.LOWEST));
            }
            if (!_this.expectPeek(end)) {
                return null;
            }
            return list;
        };
        this.l = l;
        this.errors = [];
        this.registerInfix(token.PLUS, this.parseInfixExpression);
        this.registerInfix(token.MINUS, this.parseInfixExpression);
        this.registerInfix(token.SLASH, this.parseInfixExpression);
        this.registerInfix(token.ASTERISK, this.parseInfixExpression);
        this.registerInfix(token.MOD, this.parseInfixExpression);
        this.registerInfix(token.EQ, this.parseInfixExpression);
        this.registerInfix(token.NOT_EQ, this.parseInfixExpression);
        this.registerInfix(token.AND, this.parseInfixExpression);
        this.registerInfix(token.OR, this.parseInfixExpression);
        this.registerInfix(token.LT, this.parseInfixExpression);
        this.registerInfix(token.GT, this.parseInfixExpression);
        this.registerInfix(token.LPAREN, this.parseCallExpression);
        this.registerInfix(token.LBRACKET, this.parseIndexExpression);
        this.registerInfix(token.DOT, this.parseDotIndexExpression);
        this.registerPrefix(token.IDENT, this.parseIdentifier);
        this.registerPrefix(token.INT, this.parseIntegerLiteral);
        this.registerPrefix(token.FLOAT, this.parseFloatLiteral);
        this.registerPrefix(token.BANG, this.parsePrefixExpression);
        this.registerPrefix(token.MINUS, this.parsePrefixExpression);
        this.registerPrefix(token.TYPEOF, this.parsePrefixExpression);
        this.registerPrefix(token.LPAREN, this.parseGroupedExpression);
        this.registerPrefix(token.TRUE, this.parseBoolean);
        this.registerPrefix(token.FALSE, this.parseBoolean);
        this.registerPrefix(token.IF, this.parseIfExpression);
        this.registerPrefix(token.FOR, this.parseForExpression);
        this.registerPrefix(token.WHILE, this.parseWhileExpression);
        this.registerPrefix(token.SLEEP, this.parseSleepExpression);
        this.registerPrefix(token.FUNCTION, this.parseFunctionLiteral);
        this.registerPrefix(token.STRING, this.parseStringLiteral);
        this.registerPrefix(token.LBRACKET, this.parseArrayLiteral);
        this.registerPrefix(token.LBRACE, this.parseHashLiteral);
        this.registerPrefix(token.NEW, this.parseNewExpression);
        this.registerPrefix(token.EXEC, this.parseExecExpression);
        this.registerPrefix(token.LCOMMENT, this.parseCommentBlock);
    }
    Parser.prototype.parseProgram = function () {
        var Statements = [],
            program = new ast.Program(Statements);
        this.nextToken();
        while (!this.curTokenIs(token.EOF)) {
            var stmt = this.parseStatement();
            if (stmt != null) {
                program.Statements.push(stmt);
            }
            this.nextToken();
        }
        return program;
    };
    Parser.prototype.parse = function () {
        this.errors = [];
        this.curToken = null;
        this.peekToken = null;
        this.nextToken();
        this.nextToken();
    };
    Parser.prototype.curTokenIs = function (t) {
        return this.curToken.Type == t;
    };
    Parser.prototype.peekTokenIs = function (t) {
        return this.peekToken.Type == t;
    };
    Parser.prototype.peekPrecedence = function () {
        var p = exports.precedences[this.peekToken.Type];
        if (typeof p == "number") {
            return p;
        }
        return exports.LOWEST;
    };
    Parser.prototype.curPrecedence = function () {
        var p = exports.precedences[this.curToken.Type];
        if (typeof p == "number") {
            return p;
        }
        return exports.LOWEST;
    };
    Parser.prototype.nextToken = function () {
        this.curToken = this.peekToken;
        this.peekToken = this.l.NextToken();
    };
    Parser.prototype.registerPrefix = function (tokenType, fn) {
        this.prefixParseFns[tokenType] = fn;
    };
    Parser.prototype.registerInfix = function (tokenType, fn) {
        this.infixParseFns[tokenType] = fn;
    };
    Parser.prototype.noPrefixParseFnError = function (t) {
        var msg = "no prefix parse function for " + t + " found";
        this.errors.push(msg);
    };
    Parser.prototype.expectPeek = function (t) {
        if (this.peekTokenIs(t)) {
            this.nextToken();
            return true;
        } else {
            this.peekError(t);
            return false;
        }
    };
    Parser.prototype.Errors = function () {
        return this.errors;
    };
    Parser.prototype.peekError = function (expectedType) {
        var msg = util_1.sprintf("expected next token to be %s, got %s instead", expectedType, this.peekToken.Type);
        this.errors.push(msg);
    };
    return Parser;
}();
exports.Parser = Parser;

},{"./ast":8,"./ast/expressions":7,"./ast/literals":9,"./ast/statements":10,"./token":36,"./util":37}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
function makeWebRepl(l, p, env, evaluator) {
    var webEvaluate = function webEvaluate(text) {
        if (text[text.length - 1] != ";") {
            text = text + ";";
        }
        l.setText(text);
        p.parse();
        var program = p.parseProgram(),
            evaluated;
        //console.log(JSON.stringify(program));
        if (p.Errors().length != 0) {
            util_1.printParserErrors(p.Errors());
            return;
        }
        evaluated = evaluator.Eval(program, env);
        if (evaluated != null) {
            if (evaluated.Inspect) {
                console.log(evaluated.Inspect());
                return evaluated.Inspect();
            }
        }
    };
    var win = 'window';
    var wind = eval(win) != undefined ? eval(win) : undefined;
    var document = wind ? wind.document : null;
    document.addEventListener("DOMContentLoaded", function () {
        var evaluateText = function evaluateText() {
            document.querySelector("#ecs-output").innerHTML += webEvaluate(document.querySelector("#ecs-input").value.trim()) + "<br/>\n";
            document.querySelector("#ecs-input").value = '';
        };
        document.querySelector("#ecs-button").addEventListener("click", evaluateText, true);
        document.querySelector("#ecs-input").addEventListener("keydown", function (e) {
            if (e.keyCode == 13) {
                evaluateText();
            }
        }, true);
    });
}
exports.makeWebRepl = makeWebRepl;

},{"./util":35}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var environment = require("../object/environment");
var evaluator = require("../evaluator");
var lexer = require("../lexer");
var parser = require("../parser");
var node_1 = require("./node");
var browser_1 = require("./browser");
var session_client_1 = require("./session-client");
var session_server_1 = require("./session-server");
var env;
function startRepl(mode, remoteMode, args) {
    var l = new lexer.Lexer(),
        p = new parser.Parser(l),
        client,
        server;
    if (remoteMode) {
        if (remoteMode == "client") {
            client = new session_client_1.default();
        } else {
            server = new session_server_1.default();
        }
    }
    env = new environment.Environment();
    if (!mode || mode == "cli") {
        node_1.makeCLIRepl(l, p, env, evaluator)(client, server, args);
    } else if (mode == "convolvr") {
        // implement
    } else {
        browser_1.makeWebRepl(l, p, env, evaluator);
    }
    return env;
}
exports.startRepl = startRepl;

},{"../evaluator":25,"../lexer":26,"../object/environment":27,"../parser":29,"./browser":30,"./node":32,"./session-client":33,"./session-server":34}],32:[function(require,module,exports){
(function (process){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var file_1 = require("../builtins/io/file");
var util_2 = require("../util");
function done() {
    console.log('Exiting..');
    process.exit();
}
function makeCLIRepl(l, p, env, evaluator) {
    var makeHandleInput = function makeHandleInput(onInput) {
        return function (text) {
            if (text === 'quit\n' || text === 'exit\n') {
                done();
            }
            text = text.search(/\n/) > -1 ? text.replace(/\n/g, "") : text;
            if (text[text.length - 2] != ";") {
                text = text + ";";
            }
            onInput(text);
        };
    };
    var localEvaluate = function localEvaluate(text) {
        l.setText(text);
        p.parse();
        var program = p.parseProgram(),
            evaluated;
        //console.log(JSON.stringify(program));
        if (p.Errors().length != 0) {
            util_1.printParserErrors(p.Errors());
            return;
        }
        evaluated = evaluator.Eval(program, env);
        if (evaluated != null) {
            if (evaluated.Inspect) {
                console.log(evaluated.Inspect());
                console.log("");
            }
        }
    };
    var makeRemoteEvaluate = function makeRemoteEvaluate(client) {
        return function (text) {
            client.send(text).then(function (response) {
                console.log(response);
            });
        };
    };
    return function (client, server, args) {
        if (server) {
            server.start();
        } else if (client) {
            // implement
        } else if (args && args[0]) {
            util_2.getSourceFile(args[0], file_1.readWholeFile).then(function (data) {
                localEvaluate(util_2.forceSingleLine(data));
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            util_1.introMessage();
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', makeHandleInput(client ? makeRemoteEvaluate(client) : localEvaluate));
        }
    };
}
exports.makeCLIRepl = makeCLIRepl;

}).call(this,require('_process'))

},{"../builtins/io/file":17,"../util":37,"./util":35,"_process":6}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ReplSessionClient = /** @class */function () {
    function ReplSessionClient() {}
    ReplSessionClient.prototype.send = function () {};
    ReplSessionClient.prototype.connect = function () {};
    ReplSessionClient.prototype.disconnect = function () {};
    return ReplSessionClient;
}();
exports.default = ReplSessionClient;
/**
 *
 * repl[ {session-client}, {session-server}, stdin.onEventOrW/e[ if connected ? $sendStatement : evalStatement ] ]
 *
 */

},{}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ReplSessionServer = /** @class */function () {
    function ReplSessionServer() {}
    ReplSessionServer.prototype.start = function () {};
    ReplSessionServer.prototype.handleConnect = function () {};
    ReplSessionServer.prototype.handleMessage = function (message) {};
    return ReplSessionServer;
}();
exports.default = ReplSessionServer;

},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function printParserErrors(errors) {
    //console.error(MONKEY_FACE)
    console.error("💢  You have invoked the wrath of\n");
    console.error("❌  parser errors:\n");
    errors.forEach(function (msg) {
        console.error("\t" + msg + "\n");
    });
}
exports.printParserErrors = printParserErrors;
function introMessage() {
    //console.log(convolvrLogo);
    console.log("╔════╦════════════════════════════════════════════╗");
    console.log('║ 🎈  ║                                            ║');
    console.log('║ ⚡  ║     Welcome to ECS Interactive Mode        ║');
    console.log("║ ⚡  ║     Type help(); for documentation.        ║");
    console.log("║ 🕹️  ║                                            ║");
    console.log("╚════╩════════════════════════════════════════════╝");
}
exports.introMessage = introMessage;
exports.convolvrLogo = "                                                                                                                                                                                                                                                                                        \n                                                      ./@*&;@*,                                                                                                   \n                                                    .@@*.   .&;@*,                                                                                                \n                                                 ..@%,        .,@@*.                                                                                             \n                                               .*@/,        ..@%*,@,.                                                                                            \n                                             .@@*.        .&@*.   .@,.                                    .@@@@@@@@(,                                            \n                                           .@@,.        .@@,.      .@,,                                  .@/@*.   .#@*.                                          \n                                        .,@/,        .,@/,          .@*,                               ..@*..@&,    .@*,                                         \n                                      .(@*.        .@@*.             .@(,                             ..@*.  .*@*.   .@@,                                        \n                                    .@@,.       ..@#,                 .@&,                           .*@*      .@*,   ..@*.                                      \n                                 ..@&,       .*@*,                     .@%,                         .#@*.        .@@,   .@*,                                     \n                               ./@*.        .@@,.                       .@@,                       .%@,          ..@*.   .#@*.                                   \n                             .@@*.       .*@*,                           .#@,                     .@@,             .@&,    .@*,                                  \n                          ..@@,        .&@*.                              ./@*                   .@%,               .*@*.   .@&,                                 \n                        .*@*,       ..@&,                                  .*@*.                .@/,                  .@*,   ..@*.                               \n                      .@@*.       .(@*,                                     .,@*.              .@,,                    .&@,    .@*,                              \n                    .@@,.       .@@,.                                        ..@*.            .@,.                      ..@*.   .%@*.                            \n                 ..@(,       .,@#,                                            ..@*.          .@,,                         .@%,   ..@*.                           \n               .&@*.       .@@*.                                                .@*.       ..@*.                           .,@*.   .@&,                          \n               ..@*.    ..@%,                                                    .@,.     ..@*.                              .@*,   .,@*.                        \n                 .@,, .(@*.                                                       .@,,   ..@*.                                .&@,    .@/,                       \n                  .@#@@,.                                                         .,@*.   .&@*                                 ..@*.   .(@*                      \n                   .*@@/,.                                                      .,@*,      ..@*.                                 .@%,..@#,                       \n                       ..@@@,.                                                .(@*.          .@*,                                 .,@@@,                         \n                            .%@@*.                                          .&@*.             .@@,                          ..*@@@@/,.                           \n                                .,@@%,.                                   .@@,.                ..@*.                 .,@@@@#,.                                   \n                                    .,@@@,.                             .@@,                     .@,,        ../@@@@*,.                                          \n                                         ./@@/,.                     ..@#,                        .@@*,*@@@@/,.                                                  \n                                             ..@@@,.               .*@*,                             ..                                                          \n                                                  .&@@*.         .#@*.                                                                                           \n                                                      .,@@(,.  .@@,.                 \uD83D\uDCAB                                                                           \n                                                          .,@@@@*.                                                                                               \n                                                                                                                                                                 \n                                                                                                                                                                 \n                                                                                                                                                                 \n  \n                                                                     .#@@(,..\n                                                                   ..@*,  ..,#@@@@@%*,..\n                                                                 ..@*,               ..,#@@@@@%*,.\n                                                                .@#,                            .,%@*\n                                                              .@@,                                .@(,\n                                                            .&@,.                                  .@*.\n                                                          .#@*.                                    ..@*.\n                                                        ..@*.                                       .@%,\n                                                      ..@*,                                          .@,,\n                                                     .@/,                                            ..@*.\n                                                   .@@,                                               .#@,\n                                                 .@@,.                                                 .@*,\n                                               .%@*.                                                    .@*.\n                                             .*@*.                                                      .*@*\n                                            .@@@@@@@/,..                                                 .@%,\n                                            .@*,      .,*@@@@@&*,.                                        .@,.\n                                            .@*,                ..,%@@@@@(,,.                             ..@*.\n                                            .@,,                          ..,#@@@@@#,,.                    .@@,\n                                            .@,,                                     ..*&@@@@@/,..          .@*,\n                                             ..%@@@@@/,..                                      ..*&@@@@@/,...,@*.\n                                                       .,*@@@@@%,,.                                       .,/@@&,\n                                                                 .,(@@@@@#,,.                               ..@*.\n                                                                           ..*@@@@@&*,.                     .@,,\n                                                                                     ../@@@@@%,,.          .@@,\n                                                                                               ..*&@@@@@/,,,@*.\n  ";
exports.MONKEY_FACE = "\n                        __,__\n                   .--. .\\-\"   \"-//. .--.\n                 / ..   \\\\ ////  / ..  -///--//--\n    -///--/--              | | '| /    Y     |' | |\n                 |   | -O- | -O- |/ /  |\n                  '- ,.____|____-./, -'/\n                   ''-' /_  ^___^ _ '-''    --///--//---\n       -///--//--|./|||||/ |\n                          ||||| / /   -///--//--\n                      '._'-=-'_.'\n                          '-----'\n  ";

},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ILLEGAL = "ILEGAL",
    EOF = "EOF",

// Identifiers + literals
IDENT = "IDENT",
    // add, foobar, x, y, ...
INT = "INT",
    // 1234566
FLOAT = "FLOAT",

// Operators
ASSIGN = "=",
    PLUS = "+",
    BANG = "!",
    MINUS = "-",
    SLASH = "/",
    ASTERISK = "*",
    MOD = "%",
    LT = "<",
    GT = ">",
    EQ = "==",
    NOT_EQ = "!=",
    AND = "&&",
    OR = "||",
    SOURCE = "<-",
    SINK = "->",
    INSERTION = "<<",
    EXTRACTION = ">>",

// Delimiters
COMMA = ",",
    SEMICOLON = ";",
    COLON = ":",
    LPAREN = "(",
    RPAREN = ")",
    LBRACE = "{",
    RBRACE = "}",
    LBRACKET = "[",
    RBRACKET = "]",
    DOT = ".",
    LCOMMENT = "/*",
    RCOMMENT = "*/",

// Keywords
FUNCTION = "FUNCTION",
    STRING = "STRING",
    LET_BOOL = "LET_BOOL",
    LET_INT = "LET_INT",
    LET_FLOAT = "LET_FLOAT",
    LET_STRING = "LET_STRING",
    LET = "LET",
    IF = "IF",
    ELSE = "ELSE",
    FOR = "FOR",
    SLEEP = "SLEEP",
    WHILE = "WHILE",
    RETURN = "RETURN",
    TRUE = "TRUE",
    FALSE = "FALSE",
    TYPEOF = "TYPEOF",
    EXEC = "EXEC",
    IMPORT = "IMPORT",
    NEW = "NEW",
    CLASS = "CLASS",
    EXTENDS = "EXTENDS",
    INTERFACE = "INTERFACE",
    IMPLEMENTS = "IMPLEMENTS",
    STREAM = "STREAM",
    PRIVATE = "PRIVATE",
    STATIC = "STATIC",
    FINAL = "FINAL";
exports.ILLEGAL = ILLEGAL;
exports.EOF = EOF;
exports.IDENT = IDENT;
exports.INT = INT;
exports.FLOAT = FLOAT;
exports.ASSIGN = ASSIGN;
exports.PLUS = PLUS;
exports.BANG = BANG;
exports.MINUS = MINUS;
exports.SLASH = SLASH;
exports.ASTERISK = ASTERISK;
exports.MOD = MOD;
exports.LT = LT;
exports.GT = GT;
exports.EQ = EQ;
exports.NOT_EQ = NOT_EQ;
exports.AND = AND;
exports.OR = OR;
exports.SOURCE = SOURCE;
exports.SINK = SINK;
exports.INSERTION = INSERTION;
exports.EXTRACTION = EXTRACTION;
exports.COMMA = COMMA;
exports.SEMICOLON = SEMICOLON;
exports.COLON = COLON;
exports.LPAREN = LPAREN;
exports.RPAREN = RPAREN;
exports.LBRACE = LBRACE;
exports.RBRACE = RBRACE;
exports.LBRACKET = LBRACKET;
exports.RBRACKET = RBRACKET;
exports.DOT = DOT;
exports.LCOMMENT = LCOMMENT;
exports.RCOMMENT = RCOMMENT;
exports.FUNCTION = FUNCTION;
exports.STRING = STRING;
exports.LET_BOOL = LET_BOOL;
exports.LET_INT = LET_INT;
exports.LET_FLOAT = LET_FLOAT;
exports.LET_STRING = LET_STRING;
exports.LET = LET;
exports.IF = IF;
exports.ELSE = ELSE;
exports.FOR = FOR;
exports.SLEEP = SLEEP;
exports.WHILE = WHILE;
exports.RETURN = RETURN;
exports.TRUE = TRUE;
exports.FALSE = FALSE;
exports.TYPEOF = TYPEOF;
exports.EXEC = EXEC;
exports.IMPORT = IMPORT;
exports.NEW = NEW;
exports.CLASS = CLASS;
exports.STREAM = STREAM;
exports.PRIVATE = PRIVATE;
exports.STATIC = STATIC;
exports.FINAL = FINAL;
exports.keywords = {
    "fn": FUNCTION,
    "let": LET,
    "bool": LET_BOOL,
    "int": LET_INT,
    "float": LET_FLOAT,
    "string": LET_STRING,
    "if": IF,
    "else": ELSE,
    "return": RETURN,
    "true": TRUE,
    "false": FALSE,
    "for": FOR,
    "sleep": SLEEP,
    "exec": EXEC,
    "import": IMPORT,
    "while": WHILE,
    "typeof": TYPEOF,
    "new": NEW,
    "class": CLASS,
    "interface": INTERFACE,
    "extends": EXTENDS,
    "implements": IMPLEMENTS,
    "private": PRIVATE,
    "static": STATIC,
    "final": FINAL,
    "stream": STREAM
};
exports.modifierTypes = [PRIVATE, STATIC, FINAL];
exports.modifierNames = ["private", "static", "final"];
function LookupIdent(ident) {
    var tokenType = exports.keywords[ident],
        ok = tokenType != null;
    if (ok) {
        return tokenType;
    }
    return IDENT;
}
exports.LookupIdent = LookupIdent;

},{}],37:[function(require,module,exports){
(function (process,Buffer){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", { value: true });
var object = require("./object");
var environment_1 = require("./object/environment");
var lexer = require("./lexer");
var parser = require("./parser");
var strBuiltin = new object.String("builtin"),
    TRUE = new object.Boolean(true);
exports.nativePairValue = function (hash, key) {
    return hash.Pairs[key].Value.Inspect();
};
exports.sprintf = function (s) {
    var a = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        a[_i - 1] = arguments[_i];
    }
    var strings = [],
        numbers = [];
    for (var _a = 0, a_1 = a; _a < a_1.length; _a++) {
        var e = a_1[_a];
        if (typeof e == "string") {
            strings.push(e);
        } else {
            numbers.push(e);
        }
    }
    for (var _b = 0, numbers_1 = numbers; _b < numbers_1.length; _b++) {
        var n = numbers_1[_b];
        s = s.replace(/\%d/, n);
    }
    for (var _c = 0, strings_1 = strings; _c < strings_1.length; _c++) {
        var str = strings_1[_c];
        s = s.replace(/\%s/, str);
    }
    return s;
};
function copyObject(valueNode) {
    switch (valueNode.Type()) {
        case "boolean":
            return new object.Boolean(valueNode.Value);
        case "int":
            return new object.Integer(valueNode.Value);
        case "float":
            return new object.Float(valueNode.Value);
        case "string":
            return new object.String(valueNode.Value);
        case "array":
            return new object.Array(valueNode.Elements);
        case "hash":
            return copyHashMap(valueNode);
        case "function":
        case "BUILTIN":
            return valueNode;
        default:
            return new object.NULL();
    }
}
exports.copyObject = copyObject;
function copyHashMap(data) {
    var allKeys = Object.keys(data.Pairs),
        pairData = data.Pairs;
    var pairs = {};
    for (var _i = 0, allKeys_1 = allKeys; _i < allKeys_1.length; _i++) {
        var pairKey = allKeys_1[_i];
        var pair = pairData[pairKey],
            valueNode = pair.Value,
            keyNode = pair.Key,
            isStatic = pair.modifiers && pair.modifiers.indexOf(1) > -1;
        var NewValue = void 0,
            newPair = void 0;
        if (isStatic) {
            pairs[keyNode.Value] = pair;
        } else {
            NewValue = copyObject(valueNode);
            newPair = { Key: keyNode, Value: NewValue };
            if (pair.modifiers) {
                newPair.modifiers = pair.modifiers;
            }
            pairs[keyNode.Value] = newPair;
        }
    }
    return new object.Hash(pairs);
}
exports.copyHashMap = copyHashMap;
exports.makeBuiltinClass = function (className, fields) {
    var instance = exports.makeBuiltinInterface(fields);
    instance.Constructor = instance.Pairs[className].Value;
    instance.className = className;
    instance.Pairs.builtin = { Key: strBuiltin, Value: TRUE };
    return instance;
};
exports.makeBuiltinInterface = function (methods) {
    var pairs = {};
    for (var _i = 0, methods_1 = methods; _i < methods_1.length; _i++) {
        var m = methods_1[_i];
        pairs[m[0]] = {
            Key: new object.String(m[0]),
            Value: m[1]
        };
    }
    return new object.Hash(pairs);
};
exports.addMethod = function (allMethods, methodName, contextName, builtinFn) {
    var _a;
    allMethods.push((_a = {}, _a[methodName] = {
        Key: new object.String(methodName),
        Value: new object.Builtin(builtinFn, contextName)
    }, _a));
};
exports.nativeListToArray = function (obj) {
    return new object.Array(obj.map(function (element) {
        switch (typeof element === "undefined" ? "undefined" : _typeof(element)) {
            case "string":
                return new object.String(element);
            case "number":
                return new object.Float(element);
            case "boolean":
                return new object.Boolean(element);
            case "object":
                if (typeof element.length == "number") {
                    return exports.nativeListToArray(element);
                } else {
                    return exports.nativeObjToMap(element);
                }
            default:
                return new object.NULL();
        }
    }));
};
exports.nativeObjToMap = function (obj) {
    if (obj === void 0) {
        obj = {};
    }
    var map = new object.Hash({});
    for (var objectKey in obj) {
        var value = null,
            data = obj[objectKey];
        switch (typeof data === "undefined" ? "undefined" : _typeof(data)) {
            case "string":
                value = new object.String(data);
                break;
            case "number":
                value = new object.Integer(data);
                break;
            case "boolean":
                value = new object.Boolean(data);
                break;
            case "object":
                if (typeof data.length == "number") {
                    value = exports.nativeListToArray(data);
                } else {
                    value = exports.nativeObjToMap(data);
                }
                break;
            case "function":
                console.log("native function", data);
                // need to figure this out
                // new object.Builtin(builtinFn, contextName)
                break;
            default:
        }
        map[objectKey] = {
            Key: new object.String(objectKey),
            Value: value
        };
    }
    return map;
};
exports.objectToNativeObject = function (map) {
    var obj = {},
        pairs = map.Pairs;
    for (var objectKey in pairs) {
        var value = null,
            data = pairs[objectKey].Value;
        switch (data.Type()) {
            case object.STRING_OBJ:
            case object.INTEGER_OBJ:
            case object.FLOAT_OBJ:
            case object.BOOLEAN_OBJ:
                value = data.Inspect();
                break;
            case object.HASH_OBJ:
                value = exports.objectToNativeObject(data);
                break;
            case object.ARRAY_OBJ:
                value = exports.arrayToNativeList(data);
                break;
            case "function":
                break;
            default:
        }
        obj[objectKey] = value;
    }
    return obj;
};
exports.arrayToNativeList = function (arr) {
    return arr.Elements.map(function (element) {
        switch (element.Type()) {
            case object.STRING_OBJ:
            case object.INTEGER_OBJ:
            case object.FLOAT_OBJ:
            case object.BOOLEAN_OBJ:
                return element.Inspect();
            case object.HASH_OBJ:
                return exports.objectToNativeObject(element);
            case object.ARRAY_OBJ:
                return exports.arrayToNativeList(element);
            default:
                return null;
        }
    });
};
exports.scaleString = function (input, scale) {
    var l = input.length,
        i = 0,
        o = "";
    while (i < l) {
        o += input[i].repeat(scale[0]);
        i += 1;
    }
    return o;
};
function getDocument() {
    var win = 'window',
        wind = eval(win) != undefined ? eval(win) : undefined;
    return wind ? wind.document : null;
}
function readLineFromDocument() {
    return getDocument().querySelector("#ecs-input").value;
}
exports.readLineFromDocument = readLineFromDocument;
function printToDocument(value) {
    console.log("print to document", value);
    getDocument().querySelector("#ecs-output").innerHTML += value + "<br/>\n";
}
exports.printToDocument = printToDocument;
function platformSpecificCall(context, scope, nodeImpl, webImpl, webWorkerImpl, args) {
    if (typeof Window == 'undefined') {
        return nodeImpl.apply(void 0, [context, scope].concat(args));
    } else if (context && context.postMessage) {
        return webWorkerImpl.apply(void 0, [context, scope].concat(args));
    } else {
        return webImpl.apply(void 0, [context, scope].concat(args));
    }
}
exports.platformSpecificCall = platformSpecificCall;
function workerNativeCall(context, env, callName, args) {
    context.postMessage("native call", { data: { method: callName, args: args.map(function (arg) {
                return arg.Inspect();
            }), env: env } });
}
exports.workerNativeCall = workerNativeCall;
exports.println = function (context, scope, args) {
    platformSpecificCall(context, scope, function () {
        args.forEach(function (arg) {
            console.log(arg.Inspect());
        });
    }, function () {
        args.forEach(function (arg) {
            printToDocument("" + arg.Inspect());
        });
    }, function () {
        workerNativeCall(context, scope, "print", args.map(function (arg) {
            return arg.Inspect();
        }));
    });
};
exports.printNativeString = function (context, scope, str) {
    if (typeof Window == 'undefined') {
        console.log(str);
    } else if (context && context.postMessage) {
        workerNativeCall(context, scope, "print", [str]);
    } else {
        printToDocument(str);
    }
};
// needs either evaluator or evalFn
exports.makeInterpreter = function (evalFn, _evaluator) {
    var tokenizer = new lexer.Lexer(),
        _parser = new parser.Parser(tokenizer);
    return {
        tokenizer: tokenizer,
        parser: _parser,
        evaluator: _evaluator,
        makeEnvironment: function makeEnvironment(outer) {
            return new environment_1.Environment(outer);
        },
        parseAndEvaluate: function parseAndEvaluate(text, env, onErrors, joinNewLines) {
            if (joinNewLines === void 0) {
                joinNewLines = true;
            }
            text = joinNewLines ? forceSingleLine(text) : text;
            tokenizer.setText(text);
            _parser.parse();
            var program = _parser.parseProgram();
            if (_parser.Errors().length != 0) {
                onErrors && onErrors(_parser.Errors());
                return;
            }
            var evaluated = (evalFn || _evaluator.Eval)(program, env);
            if (evaluated != null) {
                if (evaluated.Inspect) {
                    return evaluated.Inspect();
                } else {
                    return null;
                }
            }
        }
    };
};
function forceSingleLine(text) {
    text = text ? text.indexOf("\n") > -1 ? text.replace(/\n/g, "") : text : "";
    var l = text.length;
    if (text[l - 2] != ";" && text[l - 1] != ";") {
        text = text + ";";
    }
    return text;
}
exports.forceSingleLine = forceSingleLine;
var fs = require('fs');
function readStdInSync() {
    var BUFSIZE = 256;
    var buf = new Buffer(BUFSIZE),
        bytesRead;
    while (true) {
        // Loop as long as stdin input is available.
        bytesRead = 0;
        try {
            bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE);
        } catch (e) {
            if (e.code === 'EAGAIN') {
                // 'resource temporarily unavailable'
                // Happens on OS X 10.8.3 (not Windows 7!), if there's no
                // stdin input - typically when invoking a script without any
                // input (for interactive stdin input).
                // If you were to just continue, you'd create a tight loop.
                throw 'ERROR: interactive stdin input not supported.';
            } else if (e.code === 'EOF') {
                // Happens on Windows 7, but not OS X 10.8.3:
                // simply signals the end of *piped* stdin input.
                break;
            }
            throw e; // unexpected exception
        }
        if (bytesRead === 0) {
            // No more stdin input available.
            // OS X 10.8.3: regardless of input method, this is how the end 
            //   of input is signaled.
            // Windows 7: this is how the end of input is signaled for
            //   *interactive* stdin input.
            break;
        }
        // Process the chunk read.
        return buf.toString("utf8", 0, bytesRead);
    }
}
exports.readStdInSync = readStdInSync;
function getSourceFile(path, readWholeFile) {
    var file = "",
        resource = new Promise(function (resolve, reject) {
        if (false) {
            reject();
        }return resolve();
    });
    if (path.indexOf("://") > -1) {} else {
        return readWholeFile(path, fs);
    }
    return resource;
}
exports.getSourceFile = getSourceFile;

}).call(this,require('_process'),require("buffer").Buffer)

},{"./lexer":26,"./object":28,"./object/environment":27,"./parser":29,"_process":6,"buffer":4,"fs":3}]},{},[1])

//# sourceMappingURL=bundle.js.map
