export type { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "./common/api-response";

export type {
  CreateBrandRequest,
  CreateBrandResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  CreateProductRequest,
  CreateProductResponse,
  DeleteBrandResponse,
  GetBrandResponse,
  GetCategoryResponse,
  GetProductResponse,
  ListBrandsParams,
  ListBrandsResponse,
  ListCategoriesParams,
  ListCategoriesResponse,
  ListProductsParams,
  ListProductsResponse,
  UpdateBrandRequest,
  UpdateBrandResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
  UpdateProductRequest,
  UpdateProductResponse,
} from "./catalogue/contracts";

export { createCatalogueClient, type CatalogueClient } from "./catalogue/catalogue-client";

export type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ForgotPasswordResponseData,
  GetMeResponse,
  LoginRequest,
  LoginResponse,
  LoginResponseData,
  LogoutRequest,
  LogoutResponse,
  LogoutResponseData,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RefreshTokenResponseData,
  RegisterRequest,
  RegisterResponse,
  RegisterResponseData,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResetPasswordResponseData,
} from "./auth/contracts";

export { createAuthClient, type AuthClient } from "./auth/auth-client";
export type {
  CancelOrderResponse,
  ConfirmOrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersParams,
  ListOrdersResponse,
} from "./orders/contracts";
export { createOrderClient, type OrderClient } from "./orders/order-client";
export type {
  ListOrderReservationsParams,
  ListOrderReservationsResponse,
  ReleaseReservationRequest,
  ReleaseReservationResponse,
  ReserveOrderRequest,
  ReserveOrderResponse,
} from "./reservations/contracts";
export {
  createReservationClient,
  type ReservationClient,
} from "./reservations/reservation-client";
export type {
  FulfillOrderRequest,
  FulfillOrderResponse,
} from "./fulfillment/contracts";
export {
  createFulfillmentClient,
  type FulfillmentClient,
} from "./fulfillment/fulfillment-client";
export type {
  CreateInventoryItemRequest,
  CreateInventoryItemResponse,
  CreateStockMovementRequest,
  CreateStockMovementResponse,
  GetInventoryItemResponse,
  ListInventoryItemsParams,
  ListInventoryItemsResponse,
  ListStockMovementsParams,
  ListStockMovementsResponse,
} from "./inventory/contracts";
export {
  createInventoryClient,
  type InventoryClient,
} from "./inventory/inventory-client";
export type {
  GetAuditLogResponse,
  ListAuditLogsParams,
  ListAuditLogsResponse,
} from "./audit/contracts";
export { createAuditClient, type AuditClient } from "./audit/audit-client";
export type {
  CreateCustomerRequest,
  CreateCustomerResponse,
  CreateCustomerAddressRequest,
  CreateCustomerAddressResponse,
  GetCustomerAddressResponse,
  GetCustomerResponse,
  ListCustomerAddressesResponse,
  ListCustomersParams,
  ListCustomersResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
  UpdateCustomerAddressRequest,
  UpdateCustomerAddressResponse,
} from "./customers/contracts";
export { createCustomerClient, type CustomerClient } from "./customers/customer-client";
export type {
  AddCartItemRequest,
  AddCartItemResponse,
  CreateCartRequest,
  CreateCartResponse,
  GetCartResponse,
  GetCustomerCartResponse,
  RemoveCartItemResponse,
  UpdateCartItemRequest,
  UpdateCartItemResponse,
} from "./shopping-cart/contracts";
export { createCartClient, type CartClient } from "./shopping-cart/cart-client";
export type {
  CheckoutCartParams,
  CheckoutCartRequest,
  CheckoutCartResponse,
} from "./checkout/contracts";
export { createCheckoutClient, type CheckoutClient } from "./checkout/checkout-client";
export { ApiClientError } from "./http/api-error";
export { apiRequest, type ApiClientConfig } from "./http/request";
