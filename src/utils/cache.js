const redis = require("../config/redis");

const DEFAULT_TTL_SECONDS = 30;

const getCache = async (key) => {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
}

const setCache = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

const deleteCache = async (key) => {
  await redis.del(key);
};

module.exports = { getCache, setCache, deleteCache };