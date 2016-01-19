var mongodb = require('./db');
var markdown = require('markdown').markdown;
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
        reprint_info: {},
        pv: 0
    };
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取posts集合
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// 读取文章及其相关信息
Post.getAll = function(name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.find(query).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        // 解析markdown为html
        docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
        });
        //成功！以数组形式返回查询的结果
        callback(null, docs);
      });
    });
  });
};

// 获取一篇文章
Post.getOne = function(_id, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 根据文章的唯一id进行查询
            collection.findOne({
                '_id': new ObjectID(_id)
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                if (doc) {
                    // 每访问一次,pv值增加1
                    collection.update({
                        '_id': new ObjectID(_id)
                    }, {
                        $inc: {'pv': 1}
                    }, function (err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    // 解析markdown为html
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                    callback(null, doc);
                }
            });
        });
    });
};

// 返回原始发表的内容
Post.edit = function(_id, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                '_id': new ObjectID(_id)
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            });
        });
    });
};

// 更新一篇文章及其相关信息
Post.update = function(_id, post, callback) {
    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 更新文章内容
            collection.update({
                '_id': new ObjectID(_id)
            }, {
                $set: {post: post}
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// 删除文章
Post.remove = function(_id, callback) {
    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        // 读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                '_id': new ObjectID(_id)
            }, {
                w: 1
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// 一次获取十篇文章
Post.getTen = function(name, page, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        // 读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
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
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null, docs, total);
                });
                var test = collection.find(query,{skip: (page - 1) * 10,
                    limit: 10});
            });
        });
    });
};

// 返回所有文章存档信息
Post.getArchive = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        // 读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 返回只包含name、time、title属性的文档组成的存档数组
            collection.find({}, {
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                };
                callback(null, docs)
            });
        });
    });
};

// 返回所有标签
Post.getTags = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // distinct用来找出给定键的所有不同值
            collection.distinct('tags', function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// 返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
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
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// 搜索：返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
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
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// 转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 找到被转载的原文档
            collection.findOne({
                '_id': new ObjectID(reprint_from._id)
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
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
                // 新标题，如果原文章是转载的话，标题不变；否则加上'[转载]'字样
                doc.title = (doc.title.search(/\[转载\]/) > -1 ? doc.title : '[转载]' + doc.title);
                doc.comments = [];
                doc.reprint_info = {
                    'reprint_from': reprint_from
                };
                doc.pv = 0;

                // 将转载后的副本修改后存入数据库，并返回存储的文档
                collection.insert(doc, {
                    safe: true
                }, function (err, post) {
                    if (err) {
                        mongodb.close();
                        return callback(err);
                    }
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
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });

                    callback(null, post['ops'][0]);
                });
            });
        });
    });
};