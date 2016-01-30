var async = require('async');
var mongodb = require('./db');
var ObjectID = require('mongodb').ObjectID;

function Comment(_id, comment) {
    this._id = _id;
    this.comment = comment;
}

module.exports = Comment;

// 存储一条留言信息
Comment.prototype.save = function(callback) {
    var _id = this._id,
        comment = this.comment;
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
            /// 根据文章_id，并把一条留言添加到该文档的elements数组里
            collection.update({
                '_id': new ObjectID(_id)
            }, {
                $push: {'comments': comment}
            }, function (err) {
                callback(err);
            });
        }
    ], function (err) {
        mongodb.close();
        callback(err);
    });
};
