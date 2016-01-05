var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var multer = require('multer');

var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');

var storage = multer.diskStorage({
    destination: './public/images/',
    filename: function (req, file, cb) {
        cb(null, file.originalname);
  }
});
var upload = multer({storage: storage});

/* GET home page. */
router.get('/', function(req, res, next) {
    /*// 获取所有文章
    Post.getAll(null, function (err, posts) {
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: '主页',
            user: req.session.user,
            posts: posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });*/

    // 判断是否是第一页，并把请求的页数转换为number类型
    var page = parseInt(req.query.page) || 1;
    // 查询并返回第page页的10篇文章
    Post.getTen(null, page, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: '主页',
            posts: posts,
            page: page,
            isFirstPage: (page - 1) === 0,
            isLastPage: ((page - 1) * 10 + posts.length === total),
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

// registry
router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/reg', checkNotLogin);
router.post('/reg', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_repeat = req.body['password-repeat'],
        email = req.body.email;

    // 检验用户两次输入是否一致
    if (password_repeat !== password) {
        req.flash('error', '两次输入的密码不一致');
        return res.redirect('/reg');
    }

    // 生存密码的 md5 值
    var md5 = crypto.createHash('md5');

    password = md5.update(password).digest('hex');
    var newUser = new User({
        name: name,
        password: password,
        email: email
    });

    // 检查用户名是否已存在
    User.get(newUser.name, function(err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/')
        }
        if (user) {
            req.flash('error', '用户已存在！');
            return res.redirect('/reg');
        }
        //如果不存在则新增用户
        newUser.save(function(err, user) {
            if (err) {
                req.flash('error', err);
                // 注册失败返回注册页
                return res.redirect('/reg');
            }
            // 用户信息存入session
            req.session.user = user;
            req.flash('success', '注册成功！');
            res.redirect('/');
        });
    });
});

// login
router.get('/login', checkNotLogin);
router.get('/login', function(req, res) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/login', checkNotLogin);
router.post('/login', function(req, res) {
    // 生成 md5 密码值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');

    // 检查用户是否存在
    User.get(req.body.name, function(err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/login');
        }
        // 检查密码是否一致
        if (password !== user.password) {
            req.flash('error', '密码错误');
            return res.redirect('/login');
        }
        // 密码匹配，信息存入session
        req.session.user = user;
        req.flash('success', '登录成功！');
        res.redirect('/');
    });
});

// 发表博客
router.get('/post', checkLogin);
router.get('/post', function(req, res) {
    res.render('post', {
        title: '发表',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/post', checkLogin);
router.post('/post', function (req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        post = new Post(currentUser.name, req.body.title, tags, req.body.post);
    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '发布成功!');
        res.redirect('/');//发表成功跳转到主页
    });
});

// logout
router.get('/logout', checkLogin);
router.get('/logout', function(req, res) {
    // 丢掉session中的用户信息
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
});

// 上传文件
router.get('/upload', checkLogin);
router.get('/upload', function (req, res) {
    res.render('upload', {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/upload', checkLogin);
router.post('/upload', upload.single('file1'), function (req, res) {
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
});

// 归档页面
router.get('/archive', function (req, res) {
    Post.getArchive(function (err, posts) {
        if (err) {
            req.flash('errorr', err);
            return res.redirect('/');
        }
        res.render('archive', {
            title: '文档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

// 用户页面
router.get('/u/:name', function (req, res) {
    var page = parseInt(req.query.page) || 1;
    // 检查用户是否存在
    User.get(req.params.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在！');
            return res.redirect('/');
        }
        // 查询并返回该用户第page页的10篇文章
        Post.getTen(user.name, page, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) === 0,
                isLastPage: ((page - 1) * 10 + posts.length === total),
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
        /*// 查询并返回该用户的所有文章
        Post.getAll(user.name, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });*/
    });
});

// 文章页面
router.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
})

// 编辑文章
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            // 出错,返回上一页
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
        if (err) {
            req.flash('error', err);
            // 出错，返回文章页
            return res.redirect(url);
        }
        req.flash('success', '修改成功！');
        // 成功，返回文章页
        res.redirect(url);
    });
});

// 删除文章
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '删除成功！');
        res.redirect('/');
    });
});

// 留言
router.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '留言成功！');
        res.redirect('back');
    });
});

// 标签
router.get('/tags', function (req, res) {
    Post.getTags(function (err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('tags', {
            title: '标签',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('tag', {
            title: 'TAG:' + req.params.tag,
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

// 搜索
router.get('/search', function (req, res) {
    Post.search(req.query.keyword, function(err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('search', {
            title: 'SEARCH:' + req.query.keyword,
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

// 404
router.use(function (req, res) {
    res.render('404');
});

// 登录检查
function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录！');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录');
        // 返回之前的页面
        res.redirect('back');
    }
    next();
}

module.exports = router;
