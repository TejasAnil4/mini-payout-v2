const rateLimiter = require("express-rate-limit");

const generalLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, //15mins
    max:100 ,// 100 req per 15 mins

    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes"
    },

    standardHeaders: true,
    legacyHeaders: false,
})

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attmepts per 15 mins
    skip: (req) => {
    // Skip rate limiting for localhost during development
    return req.ip === "::1" || req.ip === "127.0.0.1";
  },
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter
}
