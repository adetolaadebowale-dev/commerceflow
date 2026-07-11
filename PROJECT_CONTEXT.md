# CommerceFlow Project Context

## Purpose

CommerceFlow is a professional portfolio project demonstrating the design and development of a modern ecommerce ecosystem.

The goal is not only to build software, but to demonstrate professional engineering practices.

---

# Developer Context

The project is being developed by a senior full-stack developer with 15 years of experience.

The objective is to create a portfolio project that reflects:

- Senior engineering ability

- Architecture knowledge

- Product thinking

- Modern AI-assisted development practices

---

# Core Principle

AI tools implement approved architecture.

AI tools do not redesign the architecture.

---

# Architecture Style

CommerceFlow uses:

- Modular monolith architecture

- Domain-driven feature organization

- API-first design

- TypeScript across the stack

---

# Applications

## API

Location:

apps/api

Technology:

- Next.js

- TypeScript

- Prisma

Responsibility:

Business logic and APIs.

---

## Admin

Location:

apps/admin

Technology:

- React

- TypeScript

- Vite

Responsibility:

Internal management platform.

---

## Mobile

Location:

apps/mobile

Technology:

- React Native

- Expo

Responsibility:

Customer shopping experience.

---

# Domains

The platform contains:

1. Identity

2. Customer

3. Catalogue

4. Inventory

5. Shopping

6. Checkout

7. Orders

8. Payments

9. Promotions

10. Reviews

11. Notifications

12. Analytics

13. Platform Administration

---

# Engineering Rules

## Code

- TypeScript first.

- Avoid unnecessary complexity.

- Prefer readable code.

- Follow feature-based architecture.

## Database

- PostgreSQL.

- Prisma ORM.

- UUID identifiers.

- Monetary values stored safely.

- Audit important actions.

## Git

Use:

- main branch

- feature branches

- conventional commits

---

# Cursor Rules

Before implementing:

1. Read this file.

2. Understand the architecture.

3. Ask questions if requirements are unclear.

Never:

- Replace architecture.

- Add unnecessary dependencies.

- Implement unrelated features.

---

# Current Sprint

Sprint:

0.5.3R

Goal:

Bootstrap Turborepo monorepo foundation using official framework tooling.

Deliverables:

- pnpm workspace

- Turborepo configuration

- Application shells via official CLIs (api, admin, mobile)

- Shared package structure (config, types, validation, api-client, utils, ui)

- TypeScript and developer tooling

- ADR 0001: Monorepo Architecture

---

# Current Status

Sprint 0.5.3R In Progress — staged dependency installation