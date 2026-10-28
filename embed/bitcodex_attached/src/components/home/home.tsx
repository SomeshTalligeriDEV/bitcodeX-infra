"use client";

import type { FC } from "react";

import styles from "./home.module.scss";
import { Modal } from "@bitcodex-attached/components/modal/modal";

export const Home: FC = () => {
  return (
    <div className={styles.wrapper}>
      <Modal />
    </div>
  );
};
