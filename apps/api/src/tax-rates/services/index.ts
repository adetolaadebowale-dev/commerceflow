export {
  TaxRateService,
  taxRateService,
  type TaxRateServiceDependencies,
} from "./tax-rate.service";

import { taxRateService } from "./tax-rate.service";

export function getTaxRateService() {
  return taxRateService;
}
