const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('types', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'types',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "types_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
