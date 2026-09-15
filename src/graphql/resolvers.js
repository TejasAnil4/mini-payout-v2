const walletService = require("../services/wallet.service");

const root = {
  myWallet: async (args, context) => {
    const userId = context.user.id;
    return await walletService.getMyWallet(userId);
  },
};

module.exports = root;


