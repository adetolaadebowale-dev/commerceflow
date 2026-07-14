import { MemorySessionRepository } from "../../auth/repositories/memory-session.repository";
import { MemoryUserRepository } from "../../auth/repositories/memory-user.repository";
import { AuthService } from "../../auth/services/auth.service";
import { MemoryStoreMemberRepository } from "../repositories/memory-store-member.repository";
import { AuthorizationService } from "../services/authorization.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryAuthorizationService(): {
  authService: AuthService;
  authorizationService: AuthorizationService;
  storeMemberRepository: MemoryStoreMemberRepository;
  userRepository: MemoryUserRepository;
} {
  const userRepository = new MemoryUserRepository();
  const sessionRepository = new MemorySessionRepository();
  const storeMemberRepository = new MemoryStoreMemberRepository();
  const authService = new AuthService({ userRepository, sessionRepository });

  return {
    authService,
    userRepository,
    storeMemberRepository,
    authorizationService: new AuthorizationService({
      storeMemberRepository,
      authService,
    }),
  };
}

export function createAuthorizedRequest(input: {
  accessToken: string;
  storeId?: string;
}): Request {
  const url = new URL("http://localhost/api/test");

  if (input.storeId) {
    url.searchParams.set("storeId", input.storeId);
  }

  return new Request(url, {
    headers: {
      authorization: `Bearer ${input.accessToken}`,
    },
  });
}

export async function registerStaffUser(
  authService: AuthService,
  email = `staff-${crypto.randomUUID()}@example.com`,
) {
  return authService.register({
    email,
    password: "password123",
    firstName: "Store",
    lastName: "Staff",
  });
}
