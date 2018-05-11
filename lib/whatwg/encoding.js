'use strict';

// https://github.com/nodejs/node/blob/master/lib/internal/encoding.js

({ namespace, binding, load, PrivateSymbol: PS }) => {
  const {
    encodeUtf8String,
    NativeDecoder,
    FLAGS_FLUSH,
    FLAGS_FATAL,
    FLAGS_IGNORE_BOM,
  } = binding('encoding');
  const { defineIDLClass } = load('util');

  const encodings = new Map([
    ['unicode-1-1-utf-8', 'utf-8'],
    ['utf8', 'utf-8'],
    ['utf-8', 'utf-8'],
    ['866', 'ibm866'],
    ['cp866', 'ibm866'],
    ['csibm866', 'ibm866'],
    ['ibm866', 'ibm866'],
    ['csisolatin2', 'iso-8859-2'],
    ['iso-8859-2', 'iso-8859-2'],
    ['iso-ir-101', 'iso-8859-2'],
    ['iso8859-2', 'iso-8859-2'],
    ['iso88592', 'iso-8859-2'],
    ['iso_8859-2', 'iso-8859-2'],
    ['iso_8859-2:1987', 'iso-8859-2'],
    ['l2', 'iso-8859-2'],
    ['latin2', 'iso-8859-2'],
    ['csisolatin3', 'iso-8859-3'],
    ['iso-8859-3', 'iso-8859-3'],
    ['iso-ir-109', 'iso-8859-3'],
    ['iso8859-3', 'iso-8859-3'],
    ['iso88593', 'iso-8859-3'],
    ['iso_8859-3', 'iso-8859-3'],
    ['iso_8859-3:1988', 'iso-8859-3'],
    ['l3', 'iso-8859-3'],
    ['latin3', 'iso-8859-3'],
    ['csisolatin4', 'iso-8859-4'],
    ['iso-8859-4', 'iso-8859-4'],
    ['iso-ir-110', 'iso-8859-4'],
    ['iso8859-4', 'iso-8859-4'],
    ['iso88594', 'iso-8859-4'],
    ['iso_8859-4', 'iso-8859-4'],
    ['iso_8859-4:1988', 'iso-8859-4'],
    ['l4', 'iso-8859-4'],
    ['latin4', 'iso-8859-4'],
    ['csisolatincyrillic', 'iso-8859-5'],
    ['cyrillic', 'iso-8859-5'],
    ['iso-8859-5', 'iso-8859-5'],
    ['iso-ir-144', 'iso-8859-5'],
    ['iso8859-5', 'iso-8859-5'],
    ['iso88595', 'iso-8859-5'],
    ['iso_8859-5', 'iso-8859-5'],
    ['iso_8859-5:1988', 'iso-8859-5'],
    ['arabic', 'iso-8859-6'],
    ['asmo-708', 'iso-8859-6'],
    ['csiso88596e', 'iso-8859-6'],
    ['csiso88596i', 'iso-8859-6'],
    ['csisolatinarabic', 'iso-8859-6'],
    ['ecma-114', 'iso-8859-6'],
    ['iso-8859-6', 'iso-8859-6'],
    ['iso-8859-6-e', 'iso-8859-6'],
    ['iso-8859-6-i', 'iso-8859-6'],
    ['iso-ir-127', 'iso-8859-6'],
    ['iso8859-6', 'iso-8859-6'],
    ['iso88596', 'iso-8859-6'],
    ['iso_8859-6', 'iso-8859-6'],
    ['iso_8859-6:1987', 'iso-8859-6'],
    ['csisolatingreek', 'iso-8859-7'],
    ['ecma-118', 'iso-8859-7'],
    ['elot_928', 'iso-8859-7'],
    ['greek', 'iso-8859-7'],
    ['greek8', 'iso-8859-7'],
    ['iso-8859-7', 'iso-8859-7'],
    ['iso-ir-126', 'iso-8859-7'],
    ['iso8859-7', 'iso-8859-7'],
    ['iso88597', 'iso-8859-7'],
    ['iso_8859-7', 'iso-8859-7'],
    ['iso_8859-7:1987', 'iso-8859-7'],
    ['sun_eu_greek', 'iso-8859-7'],
    ['csiso88598e', 'iso-8859-8'],
    ['csisolatinhebrew', 'iso-8859-8'],
    ['hebrew', 'iso-8859-8'],
    ['iso-8859-8', 'iso-8859-8'],
    ['iso-8859-8-e', 'iso-8859-8'],
    ['iso-ir-138', 'iso-8859-8'],
    ['iso8859-8', 'iso-8859-8'],
    ['iso88598', 'iso-8859-8'],
    ['iso_8859-8', 'iso-8859-8'],
    ['iso_8859-8:1988', 'iso-8859-8'],
    ['visual', 'iso-8859-8'],
    ['csiso88598i', 'iso-8859-8-i'],
    ['iso-8859-8-i', 'iso-8859-8-i'],
    ['logical', 'iso-8859-8-i'],
    ['csisolatin6', 'iso-8859-10'],
    ['iso-8859-10', 'iso-8859-10'],
    ['iso-ir-157', 'iso-8859-10'],
    ['iso8859-10', 'iso-8859-10'],
    ['iso885910', 'iso-8859-10'],
    ['l6', 'iso-8859-10'],
    ['latin6', 'iso-8859-10'],
    ['iso-8859-13', 'iso-8859-13'],
    ['iso8859-13', 'iso-8859-13'],
    ['iso885913', 'iso-8859-13'],
    ['iso-8859-14', 'iso-8859-14'],
    ['iso8859-14', 'iso-8859-14'],
    ['iso885914', 'iso-8859-14'],
    ['csisolatin9', 'iso-8859-15'],
    ['iso-8859-15', 'iso-8859-15'],
    ['iso8859-15', 'iso-8859-15'],
    ['iso885915', 'iso-8859-15'],
    ['iso_8859-15', 'iso-8859-15'],
    ['l9', 'iso-8859-15'],
    ['cskoi8r', 'koi8-r'],
    ['koi', 'koi8-r'],
    ['koi8', 'koi8-r'],
    ['koi8-r', 'koi8-r'],
    ['koi8_r', 'koi8-r'],
    ['koi8-ru', 'koi8-u'],
    ['koi8-u', 'koi8-u'],
    ['csmacintosh', 'macintosh'],
    ['mac', 'macintosh'],
    ['macintosh', 'macintosh'],
    ['x-mac-roman', 'macintosh'],
    ['dos-874', 'windows-874'],
    ['iso-8859-11', 'windows-874'],
    ['iso8859-11', 'windows-874'],
    ['iso885911', 'windows-874'],
    ['tis-620', 'windows-874'],
    ['windows-874', 'windows-874'],
    ['cp1250', 'windows-1250'],
    ['windows-1250', 'windows-1250'],
    ['x-cp1250', 'windows-1250'],
    ['cp1251', 'windows-1251'],
    ['windows-1251', 'windows-1251'],
    ['x-cp1251', 'windows-1251'],
    ['ansi_x3.4-1968', 'windows-1252'],
    ['ascii', 'windows-1252'],
    ['cp1252', 'windows-1252'],
    ['cp819', 'windows-1252'],
    ['csisolatin1', 'windows-1252'],
    ['ibm819', 'windows-1252'],
    ['iso-8859-1', 'windows-1252'],
    ['iso-ir-100', 'windows-1252'],
    ['iso8859-1', 'windows-1252'],
    ['iso88591', 'windows-1252'],
    ['iso_8859-1', 'windows-1252'],
    ['iso_8859-1:1987', 'windows-1252'],
    ['l1', 'windows-1252'],
    ['latin1', 'windows-1252'],
    ['us-ascii', 'windows-1252'],
    ['windows-1252', 'windows-1252'],
    ['x-cp1252', 'windows-1252'],
    ['cp1253', 'windows-1253'],
    ['windows-1253', 'windows-1253'],
    ['x-cp1253', 'windows-1253'],
    ['cp1254', 'windows-1254'],
    ['csisolatin5', 'windows-1254'],
    ['iso-8859-9', 'windows-1254'],
    ['iso-ir-148', 'windows-1254'],
    ['iso8859-9', 'windows-1254'],
    ['iso88599', 'windows-1254'],
    ['iso_8859-9', 'windows-1254'],
    ['iso_8859-9:1989', 'windows-1254'],
    ['l5', 'windows-1254'],
    ['latin5', 'windows-1254'],
    ['windows-1254', 'windows-1254'],
    ['x-cp1254', 'windows-1254'],
    ['cp1255', 'windows-1255'],
    ['windows-1255', 'windows-1255'],
    ['x-cp1255', 'windows-1255'],
    ['cp1256', 'windows-1256'],
    ['windows-1256', 'windows-1256'],
    ['x-cp1256', 'windows-1256'],
    ['cp1257', 'windows-1257'],
    ['windows-1257', 'windows-1257'],
    ['x-cp1257', 'windows-1257'],
    ['cp1258', 'windows-1258'],
    ['windows-1258', 'windows-1258'],
    ['x-cp1258', 'windows-1258'],
    ['x-mac-cyrillic', 'x-mac-cyrillic'],
    ['x-mac-ukrainian', 'x-mac-cyrillic'],
    ['chinese', 'gbk'],
    ['csgb2312', 'gbk'],
    ['csiso58gb231280', 'gbk'],
    ['gb2312', 'gbk'],
    ['gb_2312', 'gbk'],
    ['gb_2312-80', 'gbk'],
    ['gbk', 'gbk'],
    ['iso-ir-58', 'gbk'],
    ['x-gbk', 'gbk'],
    ['gb18030', 'gb18030'],
    ['big5', 'big5'],
    ['big5-hkscs', 'big5'],
    ['cn-big5', 'big5'],
    ['csbig5', 'big5'],
    ['x-x-big5', 'big5'],
    ['cseucpkdfmtjapanese', 'euc-jp'],
    ['euc-jp', 'euc-jp'],
    ['x-euc-jp', 'euc-jp'],
    ['csiso2022jp', 'iso-2022-jp'],
    ['iso-2022-jp', 'iso-2022-jp'],
    ['csshiftjis', 'shift_jis'],
    ['ms932', 'shift_jis'],
    ['ms_kanji', 'shift_jis'],
    ['shift-jis', 'shift_jis'],
    ['shift_jis', 'shift_jis'],
    ['sjis', 'shift_jis'],
    ['windows-31j', 'shift_jis'],
    ['x-sjis', 'shift_jis'],
    ['cseuckr', 'euc-kr'],
    ['csksc56011987', 'euc-kr'],
    ['euc-kr', 'euc-kr'],
    ['iso-ir-149', 'euc-kr'],
    ['korean', 'euc-kr'],
    ['ks_c_5601-1987', 'euc-kr'],
    ['ks_c_5601-1989', 'euc-kr'],
    ['ksc5601', 'euc-kr'],
    ['ksc_5601', 'euc-kr'],
    ['windows-949', 'euc-kr'],
    ['utf-16be', 'utf-16be'],
    ['utf-16le', 'utf-16le'],
    ['utf-16', 'utf-16le'],
  ]);

  // Unfortunately, String.prototype.trim also removes non-ascii whitespace,
  // so we have to do this manually
  function trimAsciiWhitespace(label) {
    let s = 0;
    let e = label.length;
    while (s < e && (
      label[s] === '\u0009' ||
      label[s] === '\u000a' ||
      label[s] === '\u000c' ||
      label[s] === '\u000d' ||
      label[s] === '\u0020')) {
      s += 1;
    }
    while (e > s && (
      label[e - 1] === '\u0009' ||
      label[e - 1] === '\u000a' ||
      label[e - 1] === '\u000c' ||
      label[e - 1] === '\u000d' ||
      label[e - 1] === '\u0020')) {
      e -= 1;
    }
    return label.slice(s, e);
  }

  function getEncodingFromLabel(label) {
    const enc = encodings.get(label);
    if (enc !== undefined) {
      return enc;
    }
    return encodings.get(trimAsciiWhitespace(label.toLowerCase()));
  }

  class TextEncoder {
    get encoding() {
      return 'utf-8';
    }

    encode(input = '') {
      return encodeUtf8String(`${input}`);
    }
  }

  defineIDLClass(TextEncoder.prototype, 'TextEncoder', {
    get encoding() {
      return 'utf-8';
    },

    encode(input = '') {
      return encodeUtf8String(`${input}`);
    },
  });

  const kHandle = PS();
  const kFlags = PS();
  const kEncoding = PS();

  const empty = new Uint8Array(0);

  class TextDecoder {
    constructor(encoding = 'utf-8', options = {}) {
      encoding = `${encoding}`;
      const enc = getEncodingFromLabel(encoding);
      if (enc === undefined) {
        throw new Error('unsupported encoding');
      }

      let flags = 0;
      if (options !== null) {
        flags |= options.fatal ? FLAGS_FATAL : 0;
        flags |= options.ignoreBOM ? FLAGS_IGNORE_BOM : 0;
      }

      this[kHandle] = new NativeDecoder(enc, flags);
      this[kFlags] = flags;
      this[kEncoding] = enc;
    }
  }

  defineIDLClass(TextDecoder.prototype, 'TextDecoder', {
    decode(input = empty, options = {}) {
      let flags = 0;
      if (options !== null) {
        flags |= options.stream ? 0 : FLAGS_FLUSH;
      }
      const ret = this[kHandle].decode(input, flags);
      if (typeof ret === 'number') {
        throw new Error('invalid encoded data');
      }
      return ret;
    },

    get encoding() {
      return this[kEncoding];
    },

    get fatal() {
      return (this[kFlags] & FLAGS_FATAL) === FLAGS_FATAL;
    },

    get ignoreBOM() {
      return (this[kFlags] & FLAGS_IGNORE_BOM) === FLAGS_IGNORE_BOM;
    },
  });

  Object.defineProperties(TextDecoder.prototype, {
    decode: { enumerable: true },
    [Symbol.toStringTag]: {
      configurable: true,
      value: 'TextDecoder',
    },
  });

  namespace.TextEncoder = TextEncoder;
  namespace.TextDecoder = TextDecoder;
};
