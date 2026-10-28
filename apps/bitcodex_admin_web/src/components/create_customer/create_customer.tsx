import styles from "./create_customer.module.scss";
import { CreateCustomerForm } from "@bitcodex-admin/components/create_customer/create_customer_form";
import { CreateCustomerHeader } from "@bitcodex-admin/components/create_customer/create_customer_header/create_customer_header";

export const CreateCustomer = () => {
  return (
    <div className={styles.wrapper}>
      <CreateCustomerHeader />
      <CreateCustomerForm />
    </div>
  );
};
