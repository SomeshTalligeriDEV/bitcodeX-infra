import {
  setKeygenRoutes2,
  setPresignRoutes2,
  setSignRoutes2,
  setTriplesRoutes2,
} from "@bitcodex/cait-sith-cosmos-compat-express/src/api";
import express from "express";

const router = express.Router();

setKeygenRoutes2(router);
setTriplesRoutes2(router);
setPresignRoutes2(router);
setSignRoutes2(router);

export default router;
