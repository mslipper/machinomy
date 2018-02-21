'use strict';

var bigNumberColumn = require('./util/bigNumberColumn');

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.createTable('payment', {
    channelId: {
      type: 'string',
      notNull: true,
      foreignKey: {
        name: 'tokens_channel_id_fk',
        table: 'channel',
        mapping: 'channelId',
        rules: {
          onDelete: 'CASCADE'
        }
      }
    },
    kind: 'string',
    token: {
      type: 'string',
      notNull: true,
      unique: true
    },
    sender: 'string',
    receiver: 'string',
    price: bigNumberColumn,
    value: bigNumberColumn,
    channelValue: bigNumberColumn,
    v: 'int',
    r: 'string',
    s: 'string',
    meta: 'string',
    contractAddress: 'string'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('payments', callback);
};

exports._meta = {
  "version": 1
};
