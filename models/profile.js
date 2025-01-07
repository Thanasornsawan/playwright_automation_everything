module.exports = (sequelize, DataTypes) => {
    const Profile = sequelize.define('Profile', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      phoneNumber: DataTypes.STRING,
      address: DataTypes.STRING,
      preferences: DataTypes.JSON
    });
  
    Profile.associate = (models) => {
      Profile.belongsTo(models.User);
    };
  
    return Profile;
  };