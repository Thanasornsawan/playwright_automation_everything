module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending',
      },
      totalAmount: DataTypes.DECIMAL(10, 2),
      shippingAddress: DataTypes.JSON,
      UserId: { // Explicitly define the userId field
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users', // Matches the table name for the User model
          key: 'id',
        },
      },
    });
  
    Order.associate = (models) => {
      Order.belongsTo(models.User, { foreignKey: 'UserId' }); // Ensure association uses 'userId'
      Order.belongsToMany(models.Product, { through: models.OrderItem });
      Order.hasMany(models.OrderItem);
    };
  
    return Order;
  };  