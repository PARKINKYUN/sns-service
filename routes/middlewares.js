const jwt = require("jsonwebtoken");
const RateLimit = require("express-rate-limit");

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.status(403).send('로그인이 필요합니다.');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        const message = encodeURIComponent("로그인한 상태입니다.");
        res.redirect(`/?error=${message}`);
    }
};

exports.verifyToken = (req, res, next) => {
    try {
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(419).json({
                code: 419,
                message: 'Token is expired',
            });
        }

        return res.status(401).json({
            code: 401,
            message: 'Invalid token',
        });
    }
};

exports.apiLimiter = new RateLimit({
    windowsMs: 60 * 1000,
    max: 1,
    handler(req, res) {
        res.status(this.statusCode).json({
            code: this.statusCode,
            message: '1 request / 1 minute',
        });
    },
});

exports.deprecated = (req, res) => {
    res.status(410).json({
        code: 410,
        message: 'This is deprecated. Use new version',
    });
};