const prisma = require('../config/db');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UnauthorizedError, ConflictError } = require("../utils/errors");

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
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

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