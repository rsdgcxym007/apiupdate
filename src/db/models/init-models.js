var DataTypes = require("sequelize").DataTypes;
var _groups = require("./groups");
var _status = require("./status");
var _status2 = require("./status2");
var _tasks = require("./tasks");
var _tasks2 = require("./tasks2");
var _types = require("./types");
var _types2 = require("./types2");
var _uploadimages = require("./uploadimages");
var _users = require("./users");

function initModels(sequelize) {
  var groups = _groups(sequelize, DataTypes);
  var status = _status(sequelize, DataTypes);
  var status2 = _status2(sequelize, DataTypes);
  var tasks = _tasks(sequelize, DataTypes);
  var tasks2 = _tasks2(sequelize, DataTypes);
  var types = _types(sequelize, DataTypes);
  var types2 = _types2(sequelize, DataTypes);
  var uploadimages = _uploadimages(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);


  return {
    groups,
    status,
    status2,
    tasks,
    tasks2,
    types,
    types2,
    uploadimages,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
