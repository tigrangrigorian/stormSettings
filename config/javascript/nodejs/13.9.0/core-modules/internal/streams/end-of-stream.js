// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).

'use strict';

const {
  ERR_INVALID_ARG_TYPE,
  ERR_STREAM_PREMATURE_CLOSE
} = require('internal/errors').codes;
const { once } = require('internal/util');

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function isReadable(stream) {
  return typeof stream.readable === 'boolean' ||
    typeof stream.readableEnded === 'boolean' ||
    !!stream._readableState;
}

function isWritable(stream) {
  return typeof stream.writable === 'boolean' ||
    typeof stream.writableEnded === 'boolean' ||
    !!stream._writableState;
}

function isWritableFinished(stream) {
  if (stream.writableFinished) return true;
  const wState = stream._writableState;
  if (!wState || wState.errored) return false;
  return wState.finished || (wState.ended && wState.length === 0);
}

function eos(stream, opts, callback) {
  if (arguments.length === 2) {
    callback = opts;
    opts = {};
  } else if (opts == null) {
    opts = {};
  } else if (typeof opts !== 'object') {
    throw new ERR_INVALID_ARG_TYPE('opts', 'object', opts);
  }
  if (typeof callback !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('callback', 'function', callback);
  }

  callback = once(callback);

  let readable = opts.readable ||
    (opts.readable !== false && isReadable(stream));
  let writable = opts.writable ||
    (opts.writable !== false && isWritable(stream));

  const onlegacyfinish = () => {
    if (!stream.writable) onfinish();
  };

  let writableFinished = stream.writableFinished ||
    (stream._writableState && stream._writableState.finished);
  const onfinish = () => {
    writable = false;
    writableFinished = true;
    if (!readable) callback.call(stream);
  };

  let readableEnded = stream.readableEnded ||
    (stream._readableState && stream._readableState.endEmitted);
  const onend = () => {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };

  const onerror = (err) => {
    callback.call(stream, err);
  };

  const onclose = () => {
    let err;
    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended)
        err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
    if (writable && !writableFinished) {
      if (!isWritableFinished(stream))
        err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };

  const onrequest = () => {
    stream.req.on('finish', onfinish);
  };

  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();
    else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) { // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  // Not all streams will emit 'close' after 'aborted'.
  if (typeof stream.aborted === 'boolean') {
    stream.on('aborted', onclose);
  }

  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);

  return function() {
    stream.removeListener('aborted', onclose);
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}

module.exports = eos;