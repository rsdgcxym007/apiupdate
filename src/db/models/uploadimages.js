const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('uploadimages', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    day_of_visit: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    hospital: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    image_rtpcr: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image_medical: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'uploadimages',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "uploadimages_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
