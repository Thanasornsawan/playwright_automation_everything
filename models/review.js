module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      rating: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 5
        }
      },
      comment: {
        type: DataTypes.TEXT
      },
      UserId: {
        type: DataTypes.UUID,
        allowNull: false,  // Ensure UserId is not null
        references: {
          model: 'Users',  // Reference to the User model
          key: 'id',
        },
      }
    });
  
    Review.associate = (models) => {
      // Associations
      Review.belongsTo(models.User, { foreignKey: 'UserId' });  // Link UserId to the User model
      Review.belongsTo(models.Product);
    };
  
    return Review;
  };  