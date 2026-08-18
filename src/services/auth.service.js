const prisma = require('../config/db');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UnauthorizedError, ConflictError } = require("../utils/errors");
const { logAction } = require("../utils/auditLog");

const register = async (data) => {
  const { email, password, fullName, phoneNumber } = data;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phoneNumber }],
    },
  });

  if (existingUser) {
    throw new ConflictError("Email or phone number already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phoneNumber,
      },
    });
    await tx.wallet.create({
      data: {
        userId: newUser.id,
      },
    });

    return newUser;
  });

  await logAction({
    userId: user.id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
};

const login = async (data) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await logAction({
      userId: null,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: null,
      metadata: { email, reason: "user_not_found" },
    });
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    await logAction({
      userId: user.id,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user.id,
      metadata: { email, reason: "wrong_password" },
    });
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  
  await logAction({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
};

module.exports = { register, login };