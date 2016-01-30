var async = require('async');
var mongodb = require('./db');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

// 存储用户信息
User.prototype.save = function(callback) {
    // 要存入数据库的用户文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email
    };
    async.waterfall([
        function (cb) {
            // 打开数据库
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            // 读取 users 集合
            db.collection('users', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // 将用户数据插入集合
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        // 成功，err 为 null，并返回存储后的用户文档
        callback(err, user['ops'][0]);
    });
};

// 读取用户信息
User.get = function(name, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('users', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            // 查找用户名（name键）值为 name 的一个文档
            collection.findOne({
                'name': name
            }, function (err, user) {
                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        callback(err, user);
    });
};


