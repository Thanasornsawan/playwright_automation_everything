const OTPAuth = require("otpauth");

function generateOTP(secret) {
  const totp = new OTPAuth.TOTP({
    secret: secret,
    digits: 6,
    algorithm: "sha1",
    period: 30,
  });

  return totp.generate();
}

module.exports = {
  generateOTP
};