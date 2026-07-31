const beneficiaryService = require("../services/beneficiary.service");
const { asyncHandler } = require("../utils/asyncHandler");

const addBeneficiary = asyncHandler(async (req, res) => {
  const merchantId = req.user.id;
  const beneficiary = await beneficiaryService.addBeneficiary(merchantId, req.body);
  res.status(201).json({
    success: true,
    message: "Beneficiary added (pending verification)",
    data: beneficiary,
  });
});

const getMyBeneficiaries = asyncHandler(async (req, res) => {
  const merchantId = req.user.id;
  const beneficiaries = await beneficiaryService.getMyBeneficiaries(merchantId);
  res.status(200).json({
    success: true,
    message: "Beneficiaries fetched",
    data: beneficiaries,
  });
});

const getPendingBeneficiaries = asyncHandler(async (req, res) => {
  const beneficiaries = await beneficiaryService.getPendingBeneficiaries();
  res.status(200).json({
    success: true,
    message: "Pending beneficiaries fetched",
    data: beneficiaries,
  });
});

const verifyBeneficiary = asyncHandler(async (req, res) => {
  const beneficiaryId = req.params.id;
  const result = await beneficiaryService.verifyBeneficiary(beneficiaryId);
  res.status(200).json({
    success: true,
    message: "Beneficiary verified",
    data: result,
  });
});

const blockBeneficiary = asyncHandler(async (req, res) => {
  const beneficiaryId = req.params.id;
  const result = await beneficiaryService.blockBeneficiary(beneficiaryId);
  res.status(200).json({
    success: true,
    message: "Beneficiary blocked",
    data: result,
  });
});

module.exports = {
  addBeneficiary,
  getMyBeneficiaries,
  getPendingBeneficiaries,
  verifyBeneficiary,
  blockBeneficiary,
};