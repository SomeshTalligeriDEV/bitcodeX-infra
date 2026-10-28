import {
  setKeygenRoutes,
  setPresignRoutes,
  setSignRoutes,
} from "@bitcodex/cait-sith-cosmos-compat-express/src/api";
import express from "express";

const router = express.Router();

setKeygenRoutes(router);
setPresignRoutes(router);
setSignRoutes(router);

export default router;
