// const prisma = require("../config/db");

// const getMyWallet = async (userId) => {
//     const wallet = await prisma.wallet.findUnique({
//         where: { userId }
//     })

//     if( !wallet){
//         throw new Error("Wallet not found");
//     }

//     return {
//         id: wallet.id,
//         balance: wallet.balance,
//         status : wallet.status,
//     }

// }

// module.exports = { getMyWallet };


const prisma = require("../config/db");
const { NotFoundError } = require("../utils/errors");

const getMyWallet = async (userId) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new NotFoundError("Wallet not found");
  }

  return {
    id: wallet.id,
    balance: wallet.balance,
    status: wallet.status,
  };
};

module.exports = { getMyWallet };