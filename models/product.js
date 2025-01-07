module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: DataTypes.TEXT,
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      category: DataTypes.STRING,
      tags: DataTypes.ARRAY(DataTypes.STRING)
    });
  
    Product.associate = (models) => {
      Product.hasMany(models.Review);
      Product.belongsToMany(models.Order, { through: models.OrderItem });
    };
  
    return Product;
  };