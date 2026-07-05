import { proxyCloudFunctionJson } from "./cloudFunctionProxy.service.js";

export const sendEmailThroughBackend = async (payload) => {
  return proxyCloudFunctionJson("sendEmail", payload);
};
