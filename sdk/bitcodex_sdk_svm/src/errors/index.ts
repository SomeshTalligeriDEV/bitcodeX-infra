export type BitcodeXSvmWalletInitError = {
  type: "bitcodex_svm_wallet_init_fail";
  msg: string;
};

export type LazyInitError = {
  type: "lazy_init_error";
  msg: string;
};

export type SendTransactionError = {
  type: "send_transaction_error";
  msg: string;
};

export type SignTransactionError = {
  type: "sign_transaction_error";
  msg: string;
};

export type SignMessageError = {
  type: "sign_message_error";
  msg: string;
};

export type BitcodeXSvmWalletError =
  | BitcodeXSvmWalletInitError
  | LazyInitError
  | SendTransactionError
  | SignTransactionError
  | SignMessageError;
