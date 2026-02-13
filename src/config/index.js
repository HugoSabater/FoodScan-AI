const { sequelize } = require('./database');
const env = require('./env');

module.exports = {
  sequelize,
  env,
};
