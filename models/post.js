var async = require('async');
var mongodb = require('./db');
var ObjectID = require('mongodb').ObjectID;

function Post(name, title, tags, post) {
    this.name = name;
    //this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

// 存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
    var date = new Date();
    // 存储各种时间格式，已便扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    // 要存入数据库的文档
    var post = {
        name: this.name,
        //head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        reprint: false,
        reprint_info: {},
        pv: 0
    };
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // 将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function (err) {
                cb(null);
            });
        }
    ], function (err) {
        mongodb.close();
        callback(err);
    });
};

// 读取文章及其相关信息
Post.getAll = function(name, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            var query = {};
            if (name) {
                query.name = name;
            }
            //根据 query 对象查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function (err, docs) {
                //成功！以数组形式返回查询的结果
                callback(err, docs);
            });
        }
    ], function (err, docs) {
        mongodb.close();
        callback(err, docs);
    });
};

// 获取一篇文章
Post.getOne = function(_id, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // 根据文章的唯一id进行查询
            collection.findOne({
                '_id': new ObjectID(_id)
            }, function (err, doc) {
                cb(err, collection, doc);
            });
        },
        function (collection, doc, cb) {
            if (doc) {
                // 每访问一次,pv值增加1
                collection.update({
                    '_id': new ObjectID(_id)
                }, {
                    $inc: {'pv': 1}
                }, function (err) {
                    cb(err, doc);
                });
            }
        }
    ], function (err, doc) {
        mongodb.close();
        callback(err, doc);
    });
};

// 获取热门文章
Post.getHot = function(callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            var query = {};

            //根据 query 对象查询文章
            collection.find(query).sort({
                pv: -1
            }).toArray(function (err, docs) {
                //成功！以数组形式返回查询的结果
                callback(err, docs);
            });
        }
    ], function (err, docs) {
        mongodb.close();
        callback(err, docs);
    });
};

// 返回原始发表的内容
Post.edit = function(_id, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                '_id':new ObjectID(_id)
            }, function (err, doc) {
                cb(err, doc);
            });
        }
    ], function (err, result) {
        mongodb.close();
        callback(err, result);
    });
};

// 更新一篇文章及其相关信息
Post.update = function(_id, post, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // 更新文章内容
            collection.update({
                '_id': new ObjectID(_id)
            }, {
                $set: {post: post}
            }, function (err) {
                cb(err);
            });
        }
    ], function (err) {
        mongodb.close();
        callback(err);
    });
};

// 删除文章
Post.remove = function(_id, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.remove({
                '_id': new ObjectID(_id)
            }, {
                w: 1
            }, function (err) {
                cb(err);
            });
        }
    ], function (err) {
        mongodb.close();
        callback(err);
    });
};

// 一次获取十篇文章
Post.getTen = function(name, page, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            var query = {};
            if (name) {
                query.name = name;
            }
            // 使用 count 返回特定查询的文档数 total
            collection.count(query, function (err, total) {
                // 根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的10个结果并以time逆序排序
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    cb(err, docs, total);
                });
            });
        },
    ], function (err, docs, total) {
        mongodb.close();
        callback(err, docs, total);
    });
};

// 返回所有文章存档信息
Post.getArchive = function(callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.find({}, {
                '_id': 1,
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                cb(err, docs)
            });
        }
    ], function (err, result) {
        mongodb.close();
        callback(err, result);
    });
};

// 返回所有标签
Post.getTags = function(callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // distinct用来找出给定键的所有不同值
            collection.distinct('tags', function (err, docs) {
                cb(err, docs);
            });
        }
    ], function (err, result) {
        mongodb.close();
        callback(err, result);
    });
};

// 返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // 查询所有tags数组内包含tag的文档，并返回只含name、time、title组成的数组
            collection.find({
                'tags': tag
            }, {
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                cb(err, docs);
            });
        }
    ], function (err, result) {
        mongodb.close();
        callback(err, result);
    });
};

// 搜索：返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            var pattern = new RegExp(keyword, "i");
            collection.find({
                'title': pattern
            }, {
                'name': 1,
                'time': 1,
                'title':1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                cb(err, docs);
            });
        }
    ], function (err, result) {
        mongodb.close();
        callback(err, result);
    });
};

// 转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // 找到被转载的原文档
            collection.findOne({
                '_id': new ObjectID(reprint_from._id)
            }, function (err, doc) {
                cb(err, collection, doc);
            });
        },
        function (collection, doc, cb) {
            // 文章被转载后将会作为一个新对象插入数据库
            var date = new Date();
            var time = {
                date: date,
                year: date.getFullYear(),
                month: date.getFullYear() + '-' + (date.getMonth() + 1),
                day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
                minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
            };
            // 注意删除原来的id
            delete doc._id;
            // 构造“新”文章对象
            doc.name = reprint_to.name;
            doc.time = time;
            // 转载标识
            doc.reprint = true;
            // 新标题，如果原文章是转载的话，标题不变；否则加上'[转载]'字样
            //doc.title = (doc.title.search(/\[转载\]/) > -1 ? doc.title : '[转载]' + doc.title);
            doc.comments = [];
            doc.reprint_info = {
                'reprint_from': reprint_from
            };
            doc.pv = 0;

            // 将转载后的副本修改后存入数据库，并返回存储的文档
            collection.insert(doc, {
                safe: true
            }, function (err, post) {
                cb(err, collection, post);
            });
        },
        function (collection, post, cb) {
            // 更新被转载原文档的reprint_info.reprint_to
            collection.update({
                '_id': new ObjectID(reprint_from._id)
            }, {
                $push: {
                    'reprint_info.reprint_to': {
                        '_id': post['ops'][0]._id
                    }
                }
            }, function (err) {
                cb(err, post['ops'][0]);
            });
        }
    ], function (err, result) {
        mongodb.close();
        callback(err, result);
    });
};