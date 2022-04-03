var DataTypes = require("sequelize").DataTypes;
var _address = require("./address");
var _groups = require("./groups");
var _status = require("./status");
var _tasks = require("./tasks");
var _types = require("./types");
var _uploadimages = require("./uploadimages");
var _users = require("./users");

function initModels(sequelize) {
  var address = _address(sequelize, DataTypes);
  var groups = _groups(sequelize, DataTypes);
  var status = _status(sequelize, DataTypes);
  var tasks = _tasks(sequelize, DataTypes);
  var types = _types(sequelize, DataTypes);
  var uploadimages = _uploadimages(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);


  return {
    address,
    groups,
    status,
    tasks,
    types,
    uploadimages,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
