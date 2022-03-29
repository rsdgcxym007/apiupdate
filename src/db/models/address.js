const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('address', {
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
