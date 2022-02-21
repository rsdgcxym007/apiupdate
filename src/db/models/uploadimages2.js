const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('uploadimages2', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    day_of_visit: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    hospital: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    image_rtpcr: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_medical: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'uploadimages2',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "uploadimage_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
