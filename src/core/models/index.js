import { buildMakeList } from "./make-list";
import { makeStock } from "./make-stock";
import { makeOrder } from "./make-order";

export { makeStock, makeOrder };
export const makeList = buildMakeList();