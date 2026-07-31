// const walletService = require("../services/wallet.service");

// const getMyWallet =async (req, res) => {
//     const userId = req.user.id;
    
//     const wallet = await walletService.getMyWallet(userId);


//     try {
//         res.status(200).json({
//             success: true,
//             message: "Wallet fetched successfully",
//             data:wallet,
//         })
//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             message: error.message,
//         })
//     }
// }

// module.exports = {getMyWallet};


const walletService = require("../services/wallet.service");
const { asyncHandler } = require("../utils/asyncHandler");

const getMyWallet = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const wallet = await walletService.getMyWallet(userId);
  res.status(200).json({
    success: true,
    message: "Wallet fetched successfully",
    data: wallet,
  });
});

module.exports = { getMyWallet };