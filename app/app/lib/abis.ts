// Minimal ABIs for the functions the frontend actually reads/writes, trimmed from the
// compiled artifacts in out/AvalLending.sol/AvalLending.json and
// out/IAPassComplianceValidator.sol/IAPassComplianceValidator.json.

export const avalLendingAbi = [
  {
    type: "function",
    name: "getCreditLine",
    stateMutability: "view",
    inputs: [{ name: "borrower", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "limit", type: "uint256" },
          { name: "debt", type: "uint256" },
          { name: "repaidCount", type: "uint256" },
          { name: "borrowedTotal", type: "uint256" },
          { name: "frozen", type: "bool" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "isCompliant",
    stateMutability: "view",
    inputs: [{ name: "borrower", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const validatorAbi = [
  {
    type: "function",
    name: "complianceVerify",
    stateMutability: "view",
    inputs: [
      { name: "poolAddress", type: "address" },
      { name: "userAddress", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getRulesV2",
    stateMutability: "view",
    inputs: [{ name: "poolAddress", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "allowedGroup", type: "bytes2" },
          { name: "allowedSubGroup", type: "bytes2" },
          { name: "minTier", type: "uint8" },
          { name: "minSubTier", type: "uint8" },
          { name: "poolCountryBitmap", type: "uint256" },
        ],
      },
    ],
  },
] as const;
