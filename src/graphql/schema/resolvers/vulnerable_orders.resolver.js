const Order = require('../../../models/order.model');
const Product = require('../../../models/product.model');

const vulnerableOrderResolver = {
  Query: {
    // Vulnerable: No input sanitization
    getOrder: async (_, { id }) => {
      return await Order.findById(id).populate('user').populate('items.product');
    },

    // Vulnerable: No status validation
    getOrders: async (_, { status }) => {
      const query = status ? { status } : {};
      return await Order.find(query).populate('user').populate('items.product');
    },

    // Vulnerable: Direct JSON filter injection
    searchOrders: async (_, { filter }) => {
      return await Order.find(filter).populate('user').populate('items.product');
    },

    // Add these new queries
    getProducts: async () => {
      return await Product.find({});
    },
    
    getProduct: async (_, { id }) => {
      return await Product.findById(id);
    }
  },

  Mutation: {
    // Multiple vulnerabilities:
    // 1. No price validation
    // 2. No quantity validation
    // 3. No metadata validation
    createOrder: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const orderItems = await Promise.all(input.items.map(async (item) => {
        const product = await Product.findById(item.id);
        if (!product) throw new Error(`Product ${item.id} not found`);
        
        return {
          product: product._id,
          quantity: item.quantity,
          price: item.customPrice || product.price
        };
      }));

      const totalAmount = orderItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      const order = new Order({
        items: orderItems,
        totalAmount,
        status: input.status || 'PENDING',
        metadata: input.metadata,
        user: user.id
      });

      return await order.save();
    },

    // Vulnerable: No status validation
    updateOrderStatus: async (_, { id, status }) => {
      return await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('user').populate('items.product');
    },

    // Vulnerable: No metadata validation
    addOrderMetadata: async (_, { id, metadata }) => {
      return await Order.findByIdAndUpdate(
        id,
        { $set: { metadata } },
        { new: true }
      ).populate('user').populate('items.product');
    },

    // Vulnerable: No validation on bulk operations
    bulkCreateOrders: async (_, { orders }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const createdOrders = await Promise.all(orders.map(async (orderInput) => {
        const orderItems = await Promise.all(orderInput.items.map(async (item) => {
          const product = await Product.findById(item.id);
          return {
            product: product._id,
            quantity: item.quantity,
            price: item.customPrice || product.price
          };
        }));

        const totalAmount = orderItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );

        const order = new Order({
          items: orderItems,
          totalAmount,
          status: orderInput.status || 'PENDING',
          metadata: orderInput.metadata,
          user: user.id
        });

        return await order.save();
      }));

      return createdOrders;
    },

    // Add these new mutations
    createProduct: async (_, { name, price, description }) => {
      // Vulnerable: No validation on price
      const product = new Product({
        name,
        price,
        description
      });
      return await product.save();
    },

    updateProduct: async (_, { id, price }) => {
      // Vulnerable: No validation on price update
      return await Product.findByIdAndUpdate(
        id,
        { price },
        { new: true }
      );
    }
  }
};

module.exports = vulnerableOrderResolver; 