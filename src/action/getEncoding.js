function looksBroken(str) {
  return /[ÃàÂ][\x80-\xBF]/.test(str);
}

function decodeOnce(str) {
  // Treat every UTF-16 code-unit’s low byte as the original raw byte
  const bytes = Uint8Array.from(
    Array.from(str, ch => ch.charCodeAt(0) & 0xff)
  );
  return new TextDecoder('utf-8').decode(bytes);
}

function fixMojibake(str) {
  let out = str;
  let safety = 5;          // prevents an infinite loop by bailing after 5 rounds
  while (safety-- && looksBroken(out)) {
    out = decodeOnce(out);
  }
  return out;
}

export { looksBroken, fixMojibake };