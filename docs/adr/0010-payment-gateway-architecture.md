# ADR 0010: Payment Gateway Architecture

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 6.4 introduced the Payment domain with internal/manual lifecycle management. CommerceFlow now needs a provider-agnostic gateway abstraction so future Stripe, Paystack, Flutterwave, and other integrations can be added without rewriting `PaymentService` or changing the public payment API.

Sprint 6.5 introduces the gateway layer only — no outbound HTTP, no real provider SDKs, no real money movement.

## Decision

### Dependency inversion

`PaymentService` depends on the `PaymentGateway` interface and `PaymentGatewayFactory`, not on concrete provider implementations. Gateway adapters are injected at composition root (production singleton) or test setup.

```
PaymentService → PaymentGatewayFactory → PaymentGateway (interface)
                                              ↑
                         InternalPaymentGateway | StripePaymentGateway (future)
```

### Adapter pattern

Each provider implements `PaymentGateway`:

| Operation | PaymentService trigger | Gateway meaning |
|-----------|------------------------|-----------------|
| `initializePayment` | `createPayment` | Open provider session/intent |
| `authorizePayment` | `authorizePayment` | Hold/approve funds |
| `capturePayment` | `markPaymentPaid` | Settle/capture funds |
| `cancelPayment` | `cancelPayment` | Void provider session |
| `verifyPayment` | *(reserved)* | Reconcile provider status |

`InternalPaymentGateway` simulates successful responses for development and automated tests. It supports optional `metadata.simulateGatewayFailure` for failure-path testing without network calls.

### Provider isolation

Provider-specific logic lives exclusively in `apps/api/src/payments/gateways/`:

- `internal-payment.gateway.ts` — simulated internal/manual adapter
- `payment-gateway.factory.ts` — resolves adapter by `PaymentProvider`

`PaymentService` orchestrates domain persistence and events; gateways perform provider I/O only (simulated in Sprint 6.5).

### Domain events and audit unchanged

- **Domain events** remain emitted by `PaymentService` after successful persistence — never by gateway adapters.
- **Audit logging** remains in route handlers — gateways do not write audit entries.
- **REST API** unchanged from Sprint 6.4.

### Gateway failure handling

Gateway operations run **before** repository status transitions. If a gateway returns `success: false`, `PaymentService` throws `PAYMENT_GATEWAY_ERROR` (502) and the payment record remains in its prior state.

Manual `failPayment` bypasses the gateway (administrative action).

### Future Stripe / Paystack / Flutterwave implementations

Future sprints will:

1. Add provider values to `PaymentProvider` (e.g. `stripe`, `paystack`)
2. Implement `{Provider}PaymentGateway` adapters with SDK/HTTP clients
3. Register adapters in `PaymentGatewayFactory`
4. Store gateway references in payment metadata or dedicated columns

No changes to route handlers or public API contracts are required.

### Testing strategy

| Layer | Approach |
|-------|----------|
| Gateway adapters | Unit test simulated success/failure paths |
| Factory | Test provider resolution and unsupported provider errors |
| PaymentService | Inject `StubPaymentGateway` via factory; verify operation order and failure propagation |
| Regression | Existing Sprint 6.4 lifecycle tests run against default `InternalPaymentGateway` |

## Consequences

### Positive

- Clean seam for external provider integration
- PaymentService testable with stub gateways
- Public API and lifecycle semantics preserved
- Provider failures isolated from premature status transitions

### Negative / trade-offs

- Gateway references not yet persisted on Payment model (deferred)
- `verifyPayment` not yet exposed via REST
- `failPayment` remains gateway-free (manual admin path)
- Internal and manual providers share the same simulated adapter

## References

- ADR 0009: Payment Foundation
- ADR 0004: Domain Events Foundation
- ADR 0003: Audit Logging Foundation
