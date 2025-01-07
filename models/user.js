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
      lastName: DataTypes.STRING
    });
  
    User.associate = (models) => {
        // Add onDelete: 'CASCADE' to enable cascading delete
        User.hasOne(models.Profile, { onDelete: 'CASCADE' });
        User.hasMany(models.Order, { onDelete: 'CASCADE' });
        User.hasMany(models.Review, { onDelete: 'CASCADE' });
    
        // Also ensure that the associated models have cascading delete
        models.Order.hasMany(models.OrderItem, { onDelete: 'CASCADE' });
      };
  
    return User;
  };