const nodeFetch = require('node-fetch')

/**
 * set signal in request
 * @param input
 * @param init
 * @returns {Request|*}
 * @constructor
 */
function AbortRequest(input, init) {
  let request = new nodeFetch.Request(input, init)
  if (init && init.signal) {
    request.signal = init.signal
  }
  return request
}

AbortRequest.prototype = nodeFetch.Request.prototype

/**
 * in node env, to abort fetch request
 */
function abortFetch(init, option) {
  const isRequest = init && init instanceof nodeFetch.Request
  const signal = isRequest ? init.signal : (option ? option.signal : undefined)
  if (signal) {
    let abortError = void 0;
    try {
      abortError = new DOMException('Aborted', 'AbortError');
    } catch (err) {
      const DOMException = require('../util/domException')
      abortError = new DOMException('Aborted', 'AbortError')
    }

    if (signal.aborted) {
      return Promise.reject(abortError);
    }

    const cancellation = new Promise(function (_, reject) {
      signal.addEventListener('abort', function () {
        return reject(abortError);
      }, {once: true});
    });
    return Promise.race([cancellation, nodeFetch(init, option)])
  }
  return nodeFetch(init, option)
}

if (global) {
  global.Response = nodeFetch.Response
  global.Request = AbortRequest
  global.Headers = nodeFetch.Headers
}

module.exports = abortFetch
