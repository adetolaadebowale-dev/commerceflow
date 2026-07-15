import type { OperationsContext, OperationsContextProvider } from "./operations-context";
import { DefaultOperationsContextProvider } from "./default-operations-context.provider";

let provider: OperationsContextProvider | null = null;

export function getOperationsContextProvider(): OperationsContextProvider {
  provider ??= new DefaultOperationsContextProvider();
  return provider;
}

export function setOperationsContextProvider(
  nextProvider: OperationsContextProvider | null,
): void {
  provider = nextProvider;
}

export type { OperationsContext, OperationsContextProvider };
