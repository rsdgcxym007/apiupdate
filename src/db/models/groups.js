const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('groups', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    active_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'groups',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "groups_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
