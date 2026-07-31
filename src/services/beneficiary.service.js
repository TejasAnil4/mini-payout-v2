const prisma = require("../config/db");
const { BadRequestError, NotFoundError, ConflictError } = require("../utils/errors");

const addBeneficiary = async (merchantId, data) => {
  const {
    type,
    beneficiaryName,
    accountHolderName,
    accountNumber,
    ifscCode,
    bankName,
    linkedUserId,
  } = data;

  // Type/shape validation now handled entirely by Zod middleware — removed manual checks

  if (type === "INTERNAL_WALLET") {
    const linkedUser = await prisma.user.findUnique({
      where: { id: linkedUserId },
    });

    if (!linkedUser) {
      throw new NotFoundError("Linked user not found");
    }

    if (linkedUser.role !== "MERCHANT") {
      throw new BadRequestError("Can only add merchants as internal beneficiaries");
    }

    if (linkedUser.id === merchantId) {
      throw new BadRequestError("Cannot add yourself as a beneficiary");
    }
  }

  const createData = {
    merchantId,
    type,
    beneficiaryName: beneficiaryName.trim(),
  };

  if (type === "BANK") {
    createData.accountHolderName = accountHolderName;
    createData.accountNumber = accountNumber;
    createData.ifscCode = ifscCode;
    createData.bankName = bankName;
  } else {
    createData.linkedUserId = linkedUserId;
  }

  const beneficiary = await prisma.beneficiary.create({
    data: createData,
  });

  return beneficiary;
};

const getMyBeneficiaries = async (merchantId) => {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { merchantId },
    include: {
      linkedUser: {
        select: { id: true, email: true, fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return beneficiaries;
};

const getPendingBeneficiaries = async () => {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { status: "PENDING" },
    include: {
      merchant: {
        select: { id: true, email: true, fullName: true },
      },
      linkedUser: {
        select: { id: true, email: true, fullName: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return beneficiaries;
};

const verifyBeneficiary = async (beneficiaryId) => {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId },
  });

  if (!beneficiary) throw new NotFoundError("Beneficiary not found");

  if (beneficiary.status !== "PENDING") {
    throw new ConflictError(`Beneficiary is already ${beneficiary.status.toLowerCase()}`);
  }

  const updated = await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: { status: "VERIFIED" },
  });

  return updated;
};

const blockBeneficiary = async (beneficiaryId) => {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId },
  });

  if (!beneficiary) throw new NotFoundError("Beneficiary not found");

  if (beneficiary.status === "BLOCKED") {
    throw new ConflictError("Beneficiary is already blocked");
  }

  const updated = await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: { status: "BLOCKED" },
  });

  return updated;
};

module.exports = {
  addBeneficiary,
  getMyBeneficiaries,
  getPendingBeneficiaries,
  verifyBeneficiary,
  blockBeneficiary,
};