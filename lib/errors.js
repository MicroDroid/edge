'use strict';

({ binding, namespace, PrivateSymbol }) => {
  const { createMessage } = binding('util');
  const kNoErrorFormat = PrivateSymbol();

  // TODO(devsnek): figure out how to define this writable=false configurable=false
  // and also let test/wpt disable it when needed.
  Error.prepareStackTrace = (error, frames) => {
    if (!frames.length) {
      return `${error}`;
    }

    const errorString = error.toString === Object.prototype.toString ? do {
      if (error.name && error.message) {
        `${error.name}: ${error.message}`;
      } else if (error.name) {
        `${error.name}`;
      } else if (error.message) {
        `Error: ${error.message}`;
      } else {
        error.toString();
      }
    } : `${error}`;

    if (error[kNoErrorFormat] === true) {
      return `${errorString}
  at ${frames.join('\n  at ')}`;
    }

    const {
      sourceLine,
      resourceName,
      lineNumber,
      startColumn,
      endColumn,
    } = createMessage(error);

    return `${resourceName}:${lineNumber}:${startColumn}
${sourceLine}
${' '.repeat(startColumn)}${'^'.repeat(endColumn - startColumn)}
${errorString}
  at ${frames.join('\n  at ')}`;
  };

  namespace.kNoErrorFormat = kNoErrorFormat;
};
