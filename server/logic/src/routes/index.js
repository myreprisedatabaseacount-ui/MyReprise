/**
 * Index des routes pour le service Node.js principal
 */

const auth = require('./auth');
const categoryRoutes = require('./categoryRoutes');
// const upload = require('./upload');
// const users = require('./users');
// const products = require('./products');
// const orders = require('./orders');
// const notifications = require('./notifications');
// const analytics = require('./analytics');

module.exports = {
  auth,
  categoryRoutes,
  // upload,
  // users,
  // products,
  // orders,
  // notifications,
  // analytics
};
