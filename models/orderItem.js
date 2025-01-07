module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      priceAtTime: DataTypes.DECIMAL(10, 2), // Store price of the product at the time of order
      OrderId: { // Explicitly define the foreign key for Order
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Orders', // Table name for Order model
          key: 'id',
        },
      },
      ProductId: { // Explicitly define the foreign key for Product
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Products', // Table name for Product model
          key: 'id',
        },
      },
    });
  
    OrderItem.associate = (models) => {
      OrderItem.belongsTo(models.Order, { foreignKey: 'OrderId' }); // Associate with Order using orderId
      OrderItem.belongsTo(models.Product, { foreignKey: 'ProductId' }); // Associate with Product using productId
    };
  
    return OrderItem;
  };  