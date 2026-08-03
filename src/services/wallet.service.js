const { getCache,setCache } = require("../utils/cache");
const prisma = require("../config/db");
const { NotFoundError } = require("../utils/errors");

const getMyWallet = async (userId) => {
  const cacheKey = `wallet:${userId}`;

  // 1. Check cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Cache] HIT for ${cacheKey}`);
    return cached;
  }

  console.log(`[Cache] MISS for ${cacheKey}`);

  // 2. Cache miss — query Postgres like normal
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new NotFoundError("Wallet not found");
  }

  const result = {
    id: wallet.id,
    balance: wallet.balance,
    status: wallet.status,
  };

  // 3. Store in cache for next time
  await setCache(cacheKey, result);

  return result;
};

module.exports = { getMyWallet };