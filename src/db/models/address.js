const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('address', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    position: {
      type: DataTypes.JSON,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    place: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    address_from_gmap: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    address_from_user: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'address',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "address_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
