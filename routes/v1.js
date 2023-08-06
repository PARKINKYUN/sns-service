const express = require("express");
const jwt = require("jsonwebtoken");

const { verifyToken, deprecated } = require("./middlewares");
const { Domain, User, Post, Hashtag } = require("../models");

const router = express.Router();

router.use(deprecated);

router.post("/token", async (req, res) => {
    const { clientSecret } = req.body;
    try {
        const domain = await Domain.findOne({
            where: { clientSecret },
            include: {
                model: User,
                attributes: ["nick", "id"],
            },
        });

        if(!domain) {
            return res.status(401).json({
                code: 401,
                message: "Invalid domain. You must register domain",
            });
        }

        const token = jwt.sign({
            id: domain.User.id,
            nick: domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: "1m",
            issuer: "snsservice",
        });
        return res.json({
            code: 200,
            message: "Token is issued",
            token,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            code: 500,
            message: "server error",
        });
    }
});

router.get("/test", verifyToken, (req, res) => {
    res.json(req.decoded);
});

router.get("/posts/my", verifyToken, (req, res) => {
    Post.findAll({ where: { userId: req.decoded.id } })
    .then((posts) => {
        console.log(posts);
        res.json({
            code: 200,
            payload: posts,
        });
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({
            code: 500,
            message: "server error",
        });
    });
});

router.get("/posts/hashtag/:title", verifyToken, async (req, res) => {
    try {
        const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
        if (!hashtag) {
            return res.status(404).json({
                code: 404,
                message: "Can't search",
            });
        }

        const posts = await hashtag.getPosts();

        return res.json({
            code: 200,
            payload: posts,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code: 500,
            message: 'server error',
        });
    }
});

module.exports = router;