export type { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "./common/api-response";

export type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  CreateProductRequest,
  CreateProductResponse,
  GetCategoryResponse,
  GetProductResponse,
  ListCategoriesParams,
  ListCategoriesResponse,
  ListProductsParams,
  ListProductsResponse,
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
export { ApiClientError } from "./http/api-error";
export { apiRequest, type ApiClientConfig } from "./http/request";
