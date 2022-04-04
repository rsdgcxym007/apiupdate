const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tasks', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    img_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // user_id_va: {
    //   type: DataTypes.UUID,
    //   allowNull: true
    // },
    level: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cancel_detail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    volunteer_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    congenital_disease: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    requirement: {
      type: DataTypes.JSON,
      allowNull: true
    },
    treatment_location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    volunteer_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tasks',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "tasks_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
