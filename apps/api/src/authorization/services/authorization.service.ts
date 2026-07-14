import type {
  AuthorizedStoreContext,
  StorePermissionCode,
} from "@commerceflow/types";

import { getBearerToken } from "../../auth/routes/request-utils";
import { authService, type AuthService } from "../../auth/services";
import { AUTHORIZATION_ERROR_CODES, AuthorizationError } from "../errors";
import { StorePermissionPolicy } from "../policies/store-permission.policy";
import {
  getStoreMemberRepository,
  type StoreMemberRepository,
} from "../repositories";

export interface AuthorizationServiceDependencies {
  readonly storeMemberRepository?: StoreMemberRepository;
  readonly authService?: AuthService;
}

export class AuthorizationService {
  private readonly storeMemberRepository: StoreMemberRepository;
  private readonly authService: AuthService;

  constructor(dependencies: AuthorizationServiceDependencies = {}) {
    this.storeMemberRepository =
      dependencies.storeMemberRepository ?? getStoreMemberRepository();
    this.authService = dependencies.authService ?? authService;
  }

  async authorizeStoreRequest(
    request: Request,
    storeId: string,
    permission: StorePermissionCode,
  ): Promise<AuthorizedStoreContext> {
    const accessToken = getBearerToken(request);
    const authContext =
      await this.authService.resolveAuthenticatedSession(accessToken);

    const membership = await this.storeMemberRepository.findActiveMembership(
      storeId,
      authContext.userId,
    );

    if (!membership) {
      throw new AuthorizationError(
        AUTHORIZATION_ERROR_CODES.STORE_ACCESS_DENIED,
        "User is not authorized for this store",
        403,
      );
    }

    if (!StorePermissionPolicy.hasPermission(membership.role, permission)) {
      throw new AuthorizationError(
        AUTHORIZATION_ERROR_CODES.INSUFFICIENT_PERMISSION,
        "Insufficient store permissions for this action",
        403,
      );
    }

    return {
      userId: authContext.userId,
      sessionId: authContext.sessionId,
      storeId,
      storeRole: membership.role,
      permission,
    };
  }
}

export const authorizationService = new AuthorizationService();
