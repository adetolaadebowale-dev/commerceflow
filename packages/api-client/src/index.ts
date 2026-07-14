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
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersParams,
  ListOrdersResponse,
} from "./orders/contracts";
export { createOrderClient, type OrderClient } from "./orders/order-client";
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
export { ApiClientError } from "./http/api-error";
export { apiRequest, type ApiClientConfig } from "./http/request";
