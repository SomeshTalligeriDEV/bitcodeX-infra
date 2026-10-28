import type { BitcodeXAdminUser } from "@bitcodex/bitcodex-types/admin";
import type {
  CustomerDashboardUser,
  PasswordHash,
} from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Customer } from "@bitcodex/bitcodex-types/customers";

import {
  createAdmin,
  createApiKeys,
  createCustomer,
  createCustomerDashboardUser,
  createKeyShareNodeMeta,
  createTssActivationSettings,
} from "./common";
import { KSNodeServerUrls as devKSNodeServerUrls } from "./dev";
import { KSNodeServerUrls as prodKSNodeServerUrls } from "./prod";
import type { KeyShareNodeMeta } from "@bitcodex-types/key_share_node_meta";
import type { TssActivationSetting } from "@bitcodex-types/tss_activate";

export interface SeedData {
  admin: BitcodeXAdminUser;
  customer: Customer;
  customerDashboardUser: CustomerDashboardUser & PasswordHash;
  apiKeys: { customer_id: string; hashed_key: string }[];
  kSNodeServerUrls: string[];
  keyShareNodeMeta: KeyShareNodeMeta;
  tssActivationSettings: TssActivationSetting;
}

export async function createSeedData(target: string): Promise<SeedData> {
  const isProd = target === "prod";

  const admin = await createAdmin();
  const customer = createCustomer();
  const customerDashboardUser = await createCustomerDashboardUser();
  const apiKeys = createApiKeys();

  const kSNodeServerUrls = isProd ? prodKSNodeServerUrls : devKSNodeServerUrls;
  const keyShareNodeMeta = createKeyShareNodeMeta();
  const tssActivationSettings = createTssActivationSettings();

  return {
    admin,
    customer,
    customerDashboardUser,
    apiKeys,
    kSNodeServerUrls,
    keyShareNodeMeta,
    tssActivationSettings,
  };
}
