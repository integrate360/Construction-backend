// Encrypt/decrypt sensitive fields (PAN, Aadhaar)
const CryptoJS = require('crypto-js');
const KEY = process.env.ENCRYPTION_KEY || 'default_key_change_in_production!!';

exports.encrypt = (text) => {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text.toString(), KEY).toString();
};

exports.decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
