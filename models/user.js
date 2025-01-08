module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }
    });
  
    User.associate = (models) => {
        User.hasOne(models.Profile, { onDelete: 'CASCADE' });
        User.hasMany(models.Order, { onDelete: 'CASCADE' });
        User.hasMany(models.Review, { onDelete: 'CASCADE' });
        models.Order.hasMany(models.OrderItem, { onDelete: 'CASCADE' });
    };
  
    return User;
};