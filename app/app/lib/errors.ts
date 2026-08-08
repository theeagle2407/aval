import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

/**
 * Maps a thrown wagmi/viem write-tx error to a calm, plain-language message. Our own
 * contract require() strings (e.g. "AvalLending: credit line frozen") are already
 * human-readable, so we surface those directly rather than a generic fallback; raw
 * provider JSON/stack traces are never shown.
 */
export function friendlyTxError(error: unknown): string {
  if (error instanceof BaseError) {
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const reason = revertError.reason ?? revertError.shortMessage;
      if (reason) {
        return reason
          .replace(/^execution reverted:\s*/i, "")
          .replace(/^AvalLending:\s*/i, "")
          .trim();
      }
    }

    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return "Transaction cancelled — try again.";
    }

    const message = error.shortMessage || error.message;
    if (/reject|denied/i.test(message)) return "Transaction cancelled — try again.";
    if (/insufficient funds/i.test(message)) return "Insufficient MON for gas.";
    return "Transaction failed — try again.";
  }

  return "Something went wrong — try again.";
}
