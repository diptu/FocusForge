---
name: devops-terraform
description: Production-grade Infrastructure-as-Code practice — Terraform module design + composition, remote state + locking + encryption, variable/output contracts with validation, plan-review discipline, progressive rollout via workspaces / per-env stacks, drift detection + reconciliation, import + refactor (moved blocks, state mv), provider pinning + version upgrades, secrets handling (Vault/SSM/Secret Manager/SOPS, never plaintext), Policy-as-Code (Sentinel/OPA/Conftest/tfsec/Checkov), cost estimation (Infracost) in PR, security scanning in CI, module test pyramid (unit / integration / contract), CI/CD integration (Atlantis / Terraform Cloud / Spacelift / GitHub Actions), tagging + compliance standards, and the IaC golden metrics (plan-time / apply-time / drift-time / blast radius). The IaC default in the devops cluster. Pairs with `devops-kubernetes` (workloads running on infra Terraform provisioned), `devops-sre` (SLO + change gates for infra), `devops-ci` (pipelines running plan/apply), `devops-observability` (dashboards for terraform-runner / drift / cost), `devops-docker` (image registry infrastructure), `cloud-aws` / `cloud-gcp` / `cloud-azure` (provider-specific patterns), and `backend-fastapi` (state backend dependencies such as Postgres / DynamoDB).
---

- **Execution**: Run `/tf <action> [args]`. Actions: `module-design`, `module-publish`, `init`, `plan`, `apply`, `destroy`, `validate`, `fmt`, `lint`, `test`, `state`, `state-mv`, `state-rm`, `import`, `drift`, `backend`, `workspace`, `variables`, `outputs`, `secrets`, `policy`, `policy-opa`, `policy-sentinel`, `scan`, `cost`, `ci`, `atlantis`, `tfc`, `upgrade`, `refactor`, `tag`, `doc`, `audit`, `rollback`, `bootstrap`.

# DevOps Terraform Protocol

## 1. Mission
Build Infrastructure-as-Code practice that is **state-safe, plan-reviewed, module-composed, policy-enforced, drift-disciplined, version-pinned, secret-clean, cost-aware, and test-covered**. The skill owns the conventions a team standardizes on — so 12 services don't end up with 12 backend configs, 12 opinions on module pinning, 12 different answers to "where do secrets live", and 12 different ways of running `terraform apply`.

> **Core principle:** Infrastructure must be reproducible from code alone. State is the single source of truth — never duplicated, never hand-edited, never committed to Git, never applied without a plan review. A change that affects prod infra is a change that needs eyes on the diff, a policy check, and a known rollback path. Idempotency is non-negotiable: `terraform apply` of unchanged code must be a no-op. Drift is a defect, not a feature — and it is reconciled in minutes, not weeks. Modules are the unit of reuse; copy-paste is the smell.

## 2. Standards
Every Terraform artifact MUST follow these rules:

- **State is sacred**: remote backend always (S3 + DynamoDB / GCS + Postgres / Terraform Cloud / Spacelift). State is encrypted at rest, versioned, lock-protected on writes, and never committed to Git. Local state for prod = P0 violation.
- **Modules are the unit of reuse**: one purpose per module, semver versioning, breaking changes bump major. Modules expose typed variables + outputs, with validation + description on every input. The public surface of a module is the variable/output list — that list is treated like an API.
- **Variables are a contract**: every variable has `type`, `description`, and (whenever possible) `validation`. No defaults on prod-critical inputs (region, environment, CIDR, account ID) — force the caller to be explicit. `sensitive = true` on anything secret-shaped; output side gets the same discipline.
- **Providers are pinned**: `required_providers` block in every root and every published module. Hashicorp / provider lock file (`.terraform.lock.hcl`) committed. No `version = "~> 4"` floats without an upper bound; no `latest` in CI.
- **Plan is reviewable**: `terraform plan -out=tfplan` and a diff that a human reads. PR comment with plan output is the unit of review. Auto-approve only for `dev` environments with explicit policy.
- **Apply is gated**: standard changes auto-apply post-merge; normal changes need approval (PR comment, Atlantis lock, Terraform Cloud run task); emergency changes need an explicit runbook + after-the-fact audit. Every apply records what, who, when, plan-hash, commit-sha.
- **Drift is detected**: cron-driven `terraform plan -detailed-exitcode` against live state. Drift → alert → remediation → postmortem if it caused impact. State-machine: state matches desired, state matches reality, state matches policy.
- **Secrets are not in code**: AWS Secrets Manager / Parameter Store (SecureString) / GCP Secret Manager / Azure Key Vault / HashiCorp Vault / SOPS-encrypted files. Never plaintext in variables, never in `tfvars`, never in state files (resources that handle their own secrets are designed not to store plaintext).
- **Policy is code**: OPA / Conftest / Sentinel / Checkov / tfsec / Trivy rules live in `policies/` and gate apply. Drift, public S3, unencrypted volumes, missing tags, overly broad IAM = blocked at policy. Policy violations carry a severity (block / warn) and a remediation hint.
- **Resources are tagged**: every resource carries `environment`, `owner`, `cost-center`, `managed-by = "terraform"`, `module-version`, `repo`. Tagging policy is a CI check (OPA / Sentinel). Untagged resources fail `terraform plan` policy gate.
- **Idempotency is required**: same `.tf` files + same providers + same state backend → same result, every apply. `for_each` keyed on stable identifiers (tags, names), never `count.index`. `lifecycle` blocks explicit when behavior matters (create_before_destroy, prevent_destroy, ignore_changes).
- **Composition over copy-paste**: services consume modules from a registry (private or public Terraform Cloud / GitHub-based). Cross-stack references via `terraform_remote_state` or remote state data sources, never duplicate state. Module nesting depth ≤ 3.
- **Tests cover modules**: unit tests with `terraform test` (native 1.6+) for variable validation + output shape; integration tests with Terratest against real (or moto / localstack / kind) cloud; contract tests verify module call signature. Tests run on every PR.
- **Costs are visible in PR**: Infracost or equivalent comment on every PR that touches infra. Cost delta > policy threshold blocks merge. Untracked resources are a policy violation (cost-center must be a tag, not an afterthought).
- **Resources are decomposable**: no root module > 500 lines / 30 resources / multiple unrelated concerns. Split into modules per concern (network, compute, data, observability). Env stacks compose modules, never duplicate them.
- **CI/CD is the path to apply**: never `terraform apply` from a laptop against prod. Atlantis / Terraform Cloud / Spacelift / GitHub Actions with branch protection = the only path. Local apply only for development, and only against dev environments.
- **Backups are tested**: state backend has versioning enabled + lifecycle for old versions. Restore procedure rehearsed quarterly. `terraform import` / `terraform state mv` / `terraform state rm` operations always preceded by `terraform state pull` + backup.
- **Upgrade discipline**: provider upgrades on a cadence (monthly / per release). Terraform CLI upgrades one minor at a time. `terraform 0.13upgrade` → `1.x` is treated as a project. Lock file committed; lock updates reviewed.
- **Observability of the IaC pipeline**: pipeline runs have metrics (queue depth, apply duration, failure rate, drift alarms). The pipeline itself is monitored, not just the resources it creates.

## 3. Workflow Actions

### `/tf module-design <module>`
Design a reusable Terraform module.
- Inputs: purpose (one sentence), variable surface (caller needs to set), output surface (what the module exposes), dependencies (other modules / data sources), lifecycle expectations (1.0 breaking-change scope), examples needed.
- Outputs:
  - module dir (`./modules/<name>/`): `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, `locals.tf`, `README.md`.
  - File structure:
    ```
    modules/<name>/
      ├── main.tf           # resources + data sources
      ├── variables.tf      # typed inputs + validation
      ├── outputs.tf        # typed outputs (sensitive flags)
      ├── versions.tf       # required_version + required_providers
      ├── locals.tf         # naming, tags, computed values
      ├── README.md         # terraform-docs generated
      ├── examples/
      │   ├── basic/
      │   └── complete/
      └── tests/
          ├── module_test.tftest.hcl   # tftest unit
          └── integration_test.go      # terratest
    ```
  - Module principles:
    - **Single purpose**: one module = one resource group with one SLA posture (e.g., `vpc`, `eks-cluster`, `rds-postgres`).
    - **No implicit defaults for prod**: `region`, `environment`, `name`, `tags` are required inputs.
    - **All variables typed + validated**: `variable "cidr" { type = string; validation { condition = can(cidrnetmask(var.cidr)) ... } }`.
    - **All outputs typed + described**: never bare `output "foo"` — always `description`, optionally `value` + `sensitive`.
    - **Naming convention**: `terraform-<provider>-<resource>` for modules in the private registry.
  - Acceptance: `terraform validate`, `terraform fmt -check`, `terraform test`, `trivy config`, `checkov -d`, `terraform-docs markdown table .` all pass.
  - Pair: `/tf module-publish` once green; `/tf policy` for guardrails.

### `/tf module-publish <module>`
Publish a module to a registry (Terraform Cloud private / GitHub-based / S3-backed).
- Inputs: module name, current version (semver), next version, changelog entry, registry target.
- Outputs:
  - Semver bump (major / minor / patch) per breaking-change scope:
    | Change | Bump | Example |
    |---|---|---|
    | Add variable (optional, with default) | minor | `new_optional = true` |
    | Remove / rename variable | major | breaking |
    | Add resource attribute or output | minor | non-breaking |
    | Remove output | major | breaking |
    | Change default value behavior | major (if observable) / minor (if cosmetic) | depends |
    | Bug fix (no surface change) | patch | `fix: ...` |
  - Tag + release notes per semver. CHANGELOG.md entry.
  - Registry publish via `git tag` (GitHub-based) / `terraform cloud module publish` (TFC) / upload to S3.
  - Rule: every publish must pass the module test suite. Tag must include commit sha. The `main` branch is what's published — no `latest = HEAD` race.
  - Pair: `/tf policy` for the registry-level policy; `/tf upgrade` for the dependency bump that triggers publish.

### `/tf init [args]`
Initialize a Terraform working directory.
- Inputs: working dir, backend config (`-backend-config=...` or `HCL`), cloud block target (Terraform Cloud), plugin cache path.
- Outputs:
  - Clean `.terraform/` directory.
  - Locked providers (`.terraform.lock.hcl`) — committed to Git; not committed when `lockfile.hcl` mode isn't supported.
  - Validated backend config (no syntax errors, credentials resolved).
  - Modules restored (child modules cached).
- Workflow:
  1. `terraform fmt -check -recursive` — fail if unformatted.
  2. `terraform init -input=false -upgrade=false -backend=false` to validate pre-flight.
  3. `terraform init -input=false -backend-config=...` for real backend.
  4. `terraform validate` — must pass before proceeding to plan.
- Rule: `terraform init` is idempotent for unchanged code. A failing init is a real signal (provider pull failure, network, auth) — don't paper over.

### `/tf plan [args]`
Generate and review an execution plan.
- Inputs: working dir, target env (workspace / tfvars / -var-file), target scope (`-target`), parallelism, refresh behavior.
- Outputs:
  - `tfplan` binary file (`terraform plan -out=tfplan`).
  - Plan summary:
    - `+ create` (N resources)
    - `~ update in-place` (N resources)
    - `- destroy` (N resources)
    - `+/- replace` (N resources) — flagged, requires justification
    - `<= read` (N data sources)
  - Exit code: 0 = no changes, 1 = error, 2 = changes (use for CI gating).
- Workflow:
  1. `terraform plan -out=tfplan -input=false -var-file=envs/<env>.tfvars`.
  2. `terraform show -json tfplan` → JSON for CI consumption.
  3. Run scanners on the plan: `tfsec`, `checkov`, `trivy config`, OPA policies, Infracost.
  4. PR-comment the summary (with destroy / replace flagged).
  5. Two-eyes review on any `destroy` or `replace` action.
- Rule: every prod plan is reviewed by a human (or by an auto-approval policy with strict scope). Plans are never "auto-applied on Friday".

### `/tf apply [args]`
Apply a reviewed plan with safety gates.
- Inputs: plan file (or `-auto-approve=false` + approval flow), env, target scope.
- Outputs:
  - State updated; `.tfplan` consumed.
  - Outputs re-read post-apply for verification.
  - Audit record: commit-sha, plan-hash, actor, timestamp, resource count.
- Workflow:
  1. Pre-apply: `terraform plan -out=tfplan` (must be current).
  2. `terraform apply -input=false tfplan` (NOT `apply -auto-approve` for prod).
  3. Post-apply: `terraform output -json` to capture current state.
  4. Smoke test (`terraform state list` to confirm expected resources exist).
  5. Apply record posted to `/<env>/terraform-apply` log.
- Gate rules:
  - `dev` env + standard change → auto-apply post-merge.
  - `staging` env → 1 approval (code owner).
  - `prod` env → 2 approvals (code owner + SRE / platform owner) + plan review.
  - `prod + destructive` (destroy / replace of prod data) → 3 approvals + IC approval + change ticket.
- Rule: apply failures (`Error: Provider produced inconsistent result after apply`) are real. Don't retry blindly. Compare state vs plan, capture the divergence, then debug.

### `/tf destroy [args]`
Tear down infra with safety gates (use sparingly).
- Inputs: env, scope (full / targeted), safety confirmations.
- Outputs:
  - `terraform plan -destroy -out=destroy.tfplan`.
  - Two-human review (or IC approval for prod).
  - Snapshot of state before destroy (`terraform state pull > backup.tfstate`).
  - Confirmation that no state is left orphaned.
- Workflow:
  1. `terraform plan -destroy -out=destroy.tfplan` → review.
  2. `terraform state pull > backups/<env>-<timestamp>.tfstate` → backup.
  3. Approval gate (3 humans for prod, 2 for staging, 1 for dev).
  4. `terraform apply -input=false destroy.tfplan`.
  5. Verify post: no resources in the cloud console, no leaks in the bill.
- Rule: destroying a prod stack is a deliberate decision, not a routine action. Most "deletes" should be `terraform state rm` (resource removed from state without destruction) — confirm intent before any destruction.

### `/tf validate [args]`
Validate configuration.
- Inputs: working dir, recursive vs single.
- Outputs:
  - `terraform fmt -check -recursive` — formatting.
  - `terraform validate` — syntax + internal consistency.
  - `tflint --recursive` — lint (provider-aware).
  - `tfsec .` or `checkov -d .` — security lint.
  - `terraform test` — module unit tests.
- Workflow:
  1. fmt check (CI runs `fmt -check -diff`).
  2. validate (CI runs `validate -no-color`).
  3. tflint (provider-aware rules; many providers publish ruleset).
  4. tfsec / Checkov / Trivy (security).
  5. tftest (unit tests).
- Rule: validation is a PR gate, not a local afterthought. Don't ship a PR with `terraform validate` failures.

### `/tf fmt [args]`
Enforce code formatting.
- Inputs: dir, recursive.
- Outputs:
  - `terraform fmt -recursive -diff` for review.
  - `terraform fmt -recursive` to rewrite.
- Rule: `terraform fmt` is non-negotiable. CI fails the PR if any file is unformatted. Tabs in, tabs out. No bike-shedding line length (HashiCorp's style is canonical).

### `/tf lint [args]`
Run tflint + provider-aware linting.
- Inputs: working dir.
- Outputs:
  - `tflint --recursive` with provider plugins (`aws`, `gcp`, `azure`).
  - Custom rules in `.tflint.hcl`.
- Rule: lint is opinionated and provider-aware. Use TFLint over `validate` alone. CI runs lint with `--minimum-failure-severity=warning` (treat warnings as errors).

### `/tf test [args]`
Run Terraform tests.
- Inputs: working dir, test type (unit / integration / contract).
- Outputs:
  - Native (`terraform test`, 1.6+): mock providers, run blocks with `assert` blocks.
    ```hcl
    run "basic" {
      command = plan
      assert {
        condition     = aws_vpc.main.cidr_block == "10.0.0.0/16"
        error_message = "VPC CIDR mismatch"
      }
    }
    ```
  - Terratest (Go): integration tests against real / mocked cloud.
    ```go
    func TestVpcModule(t *testing.T) {
      terraformOptions := &terraform.Options{
        TerraformDir: "../modules/vpc",
      }
      defer terraform.Destroy(t, terraformOptions)
      terraform.InitAndApply(t, terraformOptions)
      // assertions on outputs, cloud APIs
    }
    ```
  - Contract tests: verify module callers can pass types (automatic in tftest `module` blocks; or Terratest run with sample calls).
- Workflow:
  1. Unit tests (fast, mocked) → run on every PR.
  2. Integration tests (real cloud or local stack) → run nightly or on merge.
  3. Contract tests → run nightly against every published version.
- Pair: `/tf module-design` for the test layout; `/tf module-publish` gates on test pass.

### `/tf state [args]`
Read state safely.
- Inputs: working dir, action (`list` / `show` / `pull`).
- Outputs:
  - `terraform state list` — all resources.
  - `terraform state show <address>` — single resource from state.
  - `terraform state pull` — full state (never pipe to a file with credentials in it).
- Rule: read-only ops never modify state. `pull` results in prod environments are PII-sensitive (may include computed secrets) — handle accordingly.

### `/tf state-mv [args]`
Move resources within state (refactor).
- Inputs: source address, destination address.
- Outputs:
  - `terraform state mv 'aws_s3_bucket.old' 'aws_s3_bucket.new'` — without recreating.
  - Used for renames that should not destroy + recreate (e.g., module refactor).
  - Pair with `moved` blocks in code (`moved { from = aws_s3_bucket.old to = aws_s3_bucket.new }`) — preferred over runtime state mv for any change that ships in code.
- Rule: prefer `moved` blocks (in code, reviewed in PR) over `terraform state mv` (runtime operation, no code review). Reserve `state mv` for emergency refactors where `moved` would not work.

### `/tf state-rm [args]`
Remove a resource from state without destroying it.
- Inputs: address.
- Outputs:
  - `terraform state rm 'aws_s3_bucket.hand_managed'` — Terraform stops managing; resource stays in cloud.
  - Used when:
    - Importing from outside Terraform (rare).
    - Hand-managing a resource that Terraform created.
    - Decommissioning a resource without deletion (e.g., for data preservation).
- Rule: `state rm` is a delete-from-state, not from-cloud. Always pair with a comment in the code (`# lifecycle { prevent_destroy = true }`-equivalent: pull out of state but keep the resource).

### `/tf import [args]`
Import existing cloud resources into Terraform state.
- Inputs: resource address (in code), resource ID (in cloud).
- Outputs:
  - `terraform import 'aws_s3_bucket.imported' my-bucket-name`.
  - Generated resource block in `.tf` (Terraform 1.5+ does this via `import` blocks in code, requiring a single apply).
  - Drift baseline: any difference between imported state and cloud reality is updated on next refresh.
- Workflow (legacy, single-resource):
  1. Write the resource skeleton in `.tf`.
  2. `terraform import 'addr' 'cloud_id'`.
  3. `terraform plan` — should be no-op (state matches cloud).
  4. If plan shows drift, either accept (update state via refresh) or fix the code.
- Workflow (declarative, Terraform 1.5+):
  ```hcl
  resource "aws_s3_bucket" "imported" {
    bucket = "my-bucket-name"
    # ... full config
  }
  import {
    to = aws_s3_bucket.imported
    id = "my-bucket-name"
  }
  ```
  Apply once; Terraform imports and converges in one step.
- Rule: import is for legitimate "lift-and-shift" of existing infra. It is not a substitute for "I'll just write the code later". Each import gets a PR with the code, the state change, and a plan diff.

### `/tf drift [args]`
Detect and reconcile drift.
- Inputs: working dir, env, schedule, alert threshold.
- Outputs:
  - Drift detection script:
    ```bash
    #!/bin/bash
    set -euo pipefail
    terraform init -input=false
    terraform plan -detailed-exitcode -input=false -lock=false -out=driftplan >/dev/null
    rc=$?
    case "$rc" in
      0) # no drift; nothing to do
        exit 0
        ;;
      1) # error
        echo "drift check error"
        exit 1
        ;;
      2) # drift
        terraform show -json driftplan | jq '.resource_drift[] | {addr: .address, actions: .actions}' > drift.json
        # post to alert channel / ticketing
        exit 2
        ;;
    esac
    ```
  - Schedule: hourly for tier-0 infra (prod data plane), daily for tier-1, weekly for tier-2.
  - Alert: drift detected → page SRE; if plan proposes destroy / replace, escalate.
- Workflow:
  1. Detect (cron).
  2. Triage: is the drift from legitimate maintenance (manual hotfix), cloud-side change (DMS / EventBridge), or a Terraform bug?
  3. Reconcile: either `terraform apply` to bring reality back to code, or update code to match new reality (PR + plan + review).
  4. Postmortem if the drift happened silently and surprised us.
- Rule: drift is treated like an alertable event. If drift is allowed to accumulate, the next planned change will surprise you — `terraform apply` will "find" the drift and try to revert it. The fix is the import / refresh flow, not a fast-apply.

### `/tf backend [args]`
Configure remote state backend.
- Inputs: backend type, region, bucket, lock table, encryption config, IAM / service-account policy.
- Outputs:
  - `versions.tf` updated with backend block:
    - AWS S3 + DynamoDB (most common):
      ```hcl
      terraform {
        backend "s3" {
          bucket         = "myorg-terraform-state"
          key            = "services/<service>/<env>.tfstate"
          region         = "us-east-1"
          dynamodb_table = "myorg-terraform-locks"
          encrypt        = true
          kms_key_id     = "alias/terraform-state"
          role_arn       = "arn:aws:iam::...:role/terraform-state-access"
        }
      }
      ```
    - GCS + locking via Cloud Storage native (no external lock table needed; Terraform 1.10+ supports native locks on GCS).
    - Azure Blob + lease for locking.
    - Terraform Cloud / Spacelift / env0 (managed).
  - State bucket policy: server-side encryption (SSE-KMS or SSE-S3), versioning enabled, lifecycle for old versions (retain 90 days), block public access, deny unencrypted transport.
  - Lock table (DynamoDB or cloud-native equivalent): on-demand capacity, partition key `LockID`, encryption at rest, PITR for recovery.
  - IAM / service-account: only Terraform CI role can write state; humans read-only; audit-logged.
- Workflow:
  1. Bootstrap backend (manual step, but reproducible via bootstrap module).
  2. Configure `versions.tf` for the app stack.
  3. `terraform init -input=false -migrate-state` if migrating from local.
  4. Verify locking: take a lock from a separate process, confirm `init` waits.
- Rule: backend configuration is not a copy-paste from another project. Encrypt, version, lock, audit. The state bucket is the single most sensitive piece of a Terraform project — its compromise is a compromise of all infra described by it.

### `/tf workspace [args]`
Manage Terraform workspaces (or per-env dirs / Terragrunt stacks).
- Inputs: env list, strategy (`workspace` / `dir-per-env` / Terragrunt).
- Outputs:
  - **Strategy A — workspaces** (simple, single root module):
    ```bash
    terraform workspace new prod
    terraform workspace select prod
    terraform apply -var-file=envs/prod.tfvars
    ```
    - Pros: one code path, easy env switching.
    - Cons: shared state backend risk; backends often pinned per env via `-backend-config`.
  - **Strategy B — dir-per-env** (recommended for prod):
    ```
    infra/
      ├── modules/
      └── envs/
        ├── dev/
        │   ├── main.tf  # backend "s3" { key = ".../dev.tfstate" }
        │   └── terraform.tfvars
        ├── staging/
        └── prod/
    ```
    - Pros: full isolation; backend config can differ; reduce blast radius.
    - Cons: code duplication risk → modules.
  - **Strategy C — Terragrunt** (DRY orchestration):
    ```
    infra-live/
      ├── prod/
      │   ├── vpc/terragrunt.hcl
      │   ├── eks/terragrunt.hcl
      └── dev/...
    ```
    - Pros: per-stack remote state, dependency graph, before/after hooks.
    - Cons: extra tool; learning curve; lock-in.
- Rule: pick one strategy per org and stick to it. Strategy B + private module registry is the cleanest "no magic" option. Strategy C (Terragrunt) earns its keep at scale (10+ stacks). Strategy A breaks down as soon as env configs diverge.

### `/tf variables [args]`
Design the variable contract for a root module.
- Inputs: env list, parameter surface, defaults policy, validation rules.
- Outputs:
  - `variables.tf`:
    ```hcl
    variable "environment" {
      type        = string
      description = "Deployment environment (dev | staging | prod)"
      validation {
        condition     = contains(["dev", "staging", "prod"], var.environment)
        error_message = "Environment must be one of: dev, staging, prod."
      }
    }

    variable "vpc_cidr" {
      type        = string
      description = "CIDR block for the VPC"
      validation {
        condition     = can(cidrnetmask(var.vpc_cidr))
        error_message = "vpc_cidr must be a valid IPv4 CIDR."
      }
    }

    variable "db_password" {
      type        = string
      description = "Database master password (use AWS Secrets Manager lookup, not literal)"
      sensitive   = true
      validation {
        condition     = length(var.db_password) >= 16
        error_message = "DB password must be at least 16 characters."
      }
    }
    ```
  - `terraform.tfvars` (per env) or `-var-file` argument.
  - `*.auto.tfvars` (auto-loaded, e.g., `prod.auto.tfvars`).
  - Rule: prod inputs without defaults. All secrets via data sources, not literal values.

### `/tf outputs [args]`
Design the output contract for a root module.
- Inputs: what callers need, what crosses module boundaries.
- Outputs:
  - `outputs.tf`:
    ```hcl
    output "vpc_id" {
      description = "ID of the VPC created"
      value       = aws_vpc.main.id
    }

    output "db_endpoint" {
      description = "RDS endpoint (host)"
      value       = aws_db_instance.main.address
      sensitive   = false  # endpoint isn't a secret; the password is
    }

    output "db_password" {
      description = "RDS master password (marked sensitive — never in CI logs)"
      value       = aws_db_instance.main.password
      sensitive   = true
    }
    ```
  - Rule: every output has a `description`. `sensitive = true` on anything that could be a secret (even if it's "just" an endpoint — when in doubt, mark sensitive).

### `/tf secrets [args]`
Handle secrets without leaking.
- Inputs: secret source (AWS Secrets Manager / Vault / SOPS file / SSM), target use (variable / data source / env var for provisioner).
- Outputs:
  - Pattern 1: AWS Secrets Manager lookup:
    ```hcl
    data "aws_secretsmanager_secret_version" "db_password" {
      secret_id = "prod/db/password"
    }

    resource "aws_db_instance" "main" {
      password = data.aws_secretsmanager_secret_version.db_password.secret_string
    }
    ```
  - Pattern 2: SSM Parameter Store (SecureString):
    ```hcl
    data "aws_ssm_parameter" "db_password" {
      name            = "/prod/db/password"
      with_decryption = true
    }
    ```
  - Pattern 3: SOPS-encrypted file (commit-encrypted):
    ```yaml
    # secrets.enc.yaml — encrypted via `sops`
    db_password: ENC[AES256_GCM,...]
    ```
    Decrypted at apply via `data "sops_file"` or a `before_hook`.
  - Pattern 4: Vault dynamic secrets (with TTL):
    ```hcl
    provider "vault" {
      address = "https://vault.internal"
    }
    data "vault_generic_secret" "db" {
      path = "secret/data/prod/db"
    }
    ```
- Rule: never literal secrets in `.tf`, `.tfvars`, state (when avoidable — resources like AWS RDS may persist the password in state by design), or CI logs. `sensitive = true` everywhere. `TF_LOG = ERROR` in prod CI to suppress sensitive data in logs.

### `/tf policy [args]`
Policy-as-Code: enforce rules outside the Terraform code itself.
- Inputs: policy tool (OPA / Sentinel / Checkov / tfsec / Trivy / Conftest), ruleset.
- Outputs:
  - **OPA / Conftest** (provider-agnostic, Rego):
    ```rego
    package terraform.aws.s3
    deny[msg] {
      resource := input.resource.aws_s3_bucket[name]
      resource.acl == "public-read"
      msg := sprintf("S3 bucket %s is public-read", [name])
    }
    ```
    Apply via Conftest: `conftest test --policy policies/aws/ tfplan.json`.
  - **Sentinel** (Terraform Cloud / Enterprise, HashiCorp-native):
    ```sentinel
    import "tfplan/v2" as tfplan
    import "strings"

    main = rule {
      all resource_changes as _, rc {
        rc.type is "aws_s3_bucket" and
        (rc.change.after.acl contains "public" or
         rc.change.after.acl is "public-read")
      }
    }
    ```
  - **Checkov / tfsec / Trivy**: static scanners. Run in CI before plan. CI blocks on `HIGH/CRITICAL` findings.
- Workflow:
  1. Write policies in `policies/<cloud>/`.
  2. Run `conftest test --policy policies/ tfplan.json` in CI.
  3. Sentinel: write to `sentinel/<policy>.sentinel` and reference in Terraform Cloud workspace.
  4. Checkov: `checkov -d . --framework terraform`.
  5. tfsec: `tfsec . --severity HIGH,CRITICAL`.
  6. Findings → PR comment, fail CI on `block`, warn on `warning`.
- Rule: policy is enforced at apply (Sentinel in TFC), plan (Conftest on the JSON), and pre-apply (static scanners). Three layers for prod, one for dev.

### `/tf scan [args]`
Run security scanners (tfsec / Checkov / Trivy).
- Inputs: dir or plan file.
- Outputs:
  - `tfsec . --format json --out tfsec.json` — exit 1 on HIGH+.
  - `checkov -d . -f json -o checkov.json` — exit 1 on failed checks.
  - `trivy config .` — exit 1 on HIGH/CRITICAL.
  - Findings uploaded to SARIF, posted as PR annotations.
- Pair: `/tf policy` for runtime policy gates.

### `/tf cost [args]`
Cost estimation in PR.
- Inputs: working dir, plan file (`tfplan`).
- Outputs:
  - `infracost breakdown --path=. --terraform-plan-file=tfplan --format json --out-file=cost.json`.
  - `infracost comment github --repo=org/repo --pull-request=$PR --path=cost.json --behavior=update` (or GitLab/Bitbucket/Azure DevOps).
  - Cost delta: previous plan vs this plan. Threshold (e.g., +20% or +$500/mo) → block merge.
- Pair: `/tf plan` for the JSON input; `/tf ci` for the integration.

### `/tf ci [args]`
CI/CD integration for plan/apply.
- Inputs: CI tool (GitHub Actions / GitLab CI / CircleCI / Atlantis / TFC / Spacelift).
- Outputs:
  - **Option A — Atlantis** (PR-driven):
    ```yaml
    # atlantis.yaml
    version: 3
    projects:
      - name: prod
        dir: envs/prod
        workflow: terragrunt
        terraform_version: 1.7.5
    ```
    Triggers: `atlantis plan` comment → plan; `atlantis apply` comment → apply. PR-locked.
  - **Option B — Terraform Cloud / Enterprise** (managed runs):
    Workspace created per env. VCS connected. Plan on PR, apply on merge with run-task + Sentinel policies.
  - **Option C — GitHub Actions + manual approval**:
    ```yaml
    on:
      pull_request:
        branches: [main]
    jobs:
      plan:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: hashicorp/setup-terraform@v3
          - run: terraform fmt -check
          - run: terraform init -input=false
          - run: terraform validate
          - run: terraform plan -input=false -out=tfplan
          - uses: actions/upload-artifact@v4
            with:
              name: tfplan
              path: tfplan
    ```
    Apply gated on environment approval (`environment: prod`).
- Pair: `/tf plan`, `/tf apply`, `/tf cost`, `/tf scan`, `/tf atlantis`, `/tf tfc`.

### `/tf atlantis [args]`
Set up Atlantis (or compatible — Spacelift, env0, Digger).
- Inputs: repo, env list, workflow choice (vanilla / Terragrunt).
- Outputs:
  - Atlantis config: atlantis.yaml, server-side config.
  - Webhooks for PR events (auto-plan on push, manual apply via `atlantis apply`).
  - Workflow: atlantis workflow files (`terragrunt.yml`, etc.).
- Pair: `/tf ci` for the alternative; `/tf state` for the lock semantics.

### `/tf tfc [args]`
Set up Terraform Cloud (TFC).
- Inputs: org, workspace list, VCS repo, run tasks, Sentinel policy set.
- Outputs:
  - TFC workspaces (one per env).
  - VCS OAuth / GitHub App integration → plan on PR, apply on merge.
  - Run tasks (pre-plan / pre-apply / post-plan) — policy + cost + scan.
  - Sentinel policies enforced at apply time.
  - Variable sets per workspace (not env / not credentials — sensitive = true).
  - Notifications (Slack / webhook) for run events.
- Pair: `/tf ci` for self-hosted alternatives.

### `/tf upgrade [args]`
Provider / Terraform CLI version upgrades.
- Inputs: current version, target version, lock file mode.
- Outputs:
  - `terraform version` — current.
  - `terraform 0.13upgrade` / `1.x upgrade` command (if major).
  - Provider upgrades (`required_providers { aws = { version = "~> 5.50" } }`).
  - `.terraform.lock.hcl` updates reviewed in PR.
  - `terraform plan -out=upgrade.tfplan` — must show no resource changes for a pure version bump.
- Rule: a "version bump" PR that shows resource changes is a problem. Either the upgrade is doing more than expected, or the code wasn't ready. Investigate before approving.
- Cadence: monthly for providers (with changelog read), one CLI minor at a time.

### `/tf refactor [args]`
Refactor without recreation.
- Inputs: refactor scope (rename / restructure / move module / split resource).
- Outputs:
  - `moved` block (preferred, in-code, plan-reviewed):
    ```hcl
    moved {
      from = aws_instance.web
      to   = aws_instance.app
    }
    ```
    Terraform plans as a no-op. The block stays in code through the next apply, gets auto-removed by `terraform fmt`.
  - `terraform state mv` — runtime operation for emergencies; must be paired with an in-code fix on the next PR.
  - Splitting a resource (e.g., one `aws_security_group` → two): state mv + rewritten code.
  - Module nesting: `terraform state mv module.old.aws_s3_bucket.foo module.new.aws_s3_bucket.foo`.
- Rule: prefer `moved` blocks (`moved { from = ... to = ... }`). Code review beats runtime state manipulation.

### `/tf tag [args]`
Enforce tagging policy.
- Inputs: tag keys required (environment, owner, cost-center, managed-by, repo, terraform-version, module-version), enforcement mode.
- Outputs:
  - Provider-level default tags (AWS):
    ```hcl
    provider "aws" {
      region = var.region
      default_tags {
        tags = {
          Environment = var.environment
          Owner       = var.owner
          ManagedBy   = "terraform"
          TerraformVersion = "1.7.5"
        }
      }
    }
    ```
  - GCP / Azure: similar via provider config.
  - Tagging policy as code (Sentinel / OPA): resources missing required tags → block.
  - Tag audit: list resources without required tags, fail the PR policy check.
- Rule: tagging is not optional and not a final-mile cleanup. It's a CI gate. Without tags, no `terraform apply` in prod.

### `/tf doc [args]`
Auto-generate module documentation.
- Inputs: module dir, doc format (markdown / yaml / json).
- Outputs:
  - `terraform-docs markdown table .` → README.md with Inputs / Outputs / Providers / Resources sections.
  - `terraform-docs markdown document .` → detailed doc with descriptions.
  - Pre-commit hook / CI runs `terraform-docs` and replaces the README section.
- Rule: docs are generated, not hand-written. Hand-written doc goes stale. Auto-generated doc is always current.

### `/tf bootstrap [args]`
Initial bootstrap of a Terraform project from zero.
- Inputs: cloud, org, project, env list, modules chosen, backend choice.
- Outputs:
  1. Bootstrap state backend manually (S3 bucket, DynamoDB table — separate one-time setup via AWS console / Terraform in a `--backend=local` bootstrap, then `terraform init -migrate-state`).
  2. Bootstrap IAM / service accounts (Terraform CI role, human readers, audit).
  3. Bootstrap `versions.tf` with backend config.
  4. Bootstrap `providers.tf` with provider config + default tags.
  5. Bootstrap `variables.tf` + `outputs.tf` + `main.tf` skeleton.
  6. Bootstrap CI/CD pipeline.
  7. Bootstrap Sentinel / OPA policies.
  8. Bootstrap cost estimation.
  9. First `terraform plan` against an empty workspace.
  10. First `terraform apply` after review.
- Rule: bootstrap is recorded as a PR / design doc. Subsequent services follow the same template.

### `/tf rollback [args]`
Roll back a failed apply or a problematic change.
- Inputs: previous known-good state, option (apply previous code / state manipulation).
- Outputs:
  - **Option A — git revert + apply**:
    1. `git revert <bad-commit-sha>` on `main`.
    2. Push → CI plans a revert.
    3. Approve + apply.
  - **Option B — `terraform apply` against prior commit**:
    1. `git checkout <last-good-commit>`.
    2. `terraform init -input=false -upgrade=false`.
    3. `terraform plan` — confirm the diff is the desired reversal.
    4. `terraform apply`.
    5. Cherry-pick or revert the bad commit later.
  - **Option C — state mv** (for refactors gone wrong):
    1. Backup state.
    2. `terraform state mv` the resource back.
    3. Restore code to prior state.
  - Rule: rollback is its own deploy, with its own plan review. Do not run `apply` ad-hoc.

### `/tf audit [args]`
Audit an existing Terraform project. See §6.

## 4. Execution Order (Full Terraform Engagement)

For a new project / service / org entering Terraform practice:

1. `/tf bootstrap` — backend, IAM, providers, skeleton.
2. `/tf policy` — Sentinel / OPA / Conftest / Checkov rules.
3. `/tf module-design <module>` — start with the top module (e.g., `vpc`, `eks-cluster`).
4. `/tf module-publish <module>` — push to private registry.
5. `/tf variables` + `/tf outputs` — contract for the root.
6. `/tf fmt` + `/tf validate` + `/tf lint` + `/tf scan` — pre-PR gates.
7. `/tf test` — unit + integration.
8. `/tf plan` — first plan in PR.
9. `/tf cost` — Infracost comment in PR.
10. `/tf ci` — pipeline wiring (Atlantis / TFC / GitHub Actions).
11. Two-eyes review on plan → apply.
12. `/tf drift` — cron-driven drift detection.
13. `/tf upgrade` — provider / CLI cadence.
14. `/tf tag` — enforce tagging policy (if not in step 2).
15. `/tf refactor` — for structural changes (`moved` blocks preferred).
16. `/tf audit` — quarterly / pre-launch review.

> 🛑 **No prod apply without:** plan reviewed by 1+ humans (2+ for prod), Sentinel / OPA / static scan passing, cost delta acknowledged, tagging policy passing, on-call aware, rollback plan (git revert → apply, or `state mv`) rehearsed in staging, state backend versioning + lock + encryption verified.

## 5. Output Location
All artifacts under default locations:

- `terraform/` or `infra/` at repo root → app infra.
- `terraform-modules/` or `modules/` → published modules.
- `policies/` → OPA / Conftest / Sentinel files.
- `terraform-plans/` → plan JSON archives (CI artifact, not committed).
- `.tflint.hcl`, `.terraform-version`, `.terraform.lock.hcl` at root.
- `.github/workflows/` or `.gitlab-ci.yml` or `atlantis.yaml` → CI/CD.

Override with `--out=<path>`.

Per-org conventions:
- `infra-live/<account>/<region>/<service>/<env>/` → Strategy B (dir-per-env, envs via stack).
- `infra-modules/<service>/` → Strategy B's module source.
- `infra-modules/_landscape/` → Terragrunt hcl files (Strategy C).

## 6. Audit Workflow
When asked to audit an existing Terraform practice:

1. **State safety**: every root has a remote backend (S3+GCS+Azure Blob+TFC). State encryption at rest + in transit. Lock table exists + lock in use. Versioning enabled on state buckets. Public access blocked. State never in Git. Lock-file checked into Git. **Violation severity:** P0.
2. **Backend hygiene**: state bucket policy = encryption, versioning, lifecycle, no public. Lock table encryption on. Cross-region replication for disaster recovery. **Severity:** P1.
3. **Module discipline**: every reusable resource is a module, not a copy-paste. Published to a registry. Semver tagged. Per-module README generated by terraform-docs. Module call sites use named arguments. **Severity:** P1.
4. **Variable contract**: every variable has `type`, `description`, and `validation` where applicable. Prod-critical vars (region, env, name, CIDR, tags) have no defaults. **Severity:** P1.
5. **Output contract**: every output has `description`. `sensitive = true` on secrets and on anything `sensitive-by-nature` (DB password, API key). **Severity:** P1.
6. **Provider pinning**: every root + every module declares `required_providers` with explicit versions. Lock file committed. No `~>` without upper bounds (no `latest`). **Severity:** P1.
7. **Plan discipline**: every prod apply preceded by a plan PR. Plan reviewed by 1+ humans (2+ for prod). Destroy / replace flagged. **Severity:** P1.
8. **Apply gates**: dev auto-apply; staging 1 approval; prod 2 approvals + SRE; destructive change 3 approvals + IC + change ticket. **Severity:** P0 if prod has no approval.
9. **Drift detection**: cron `terraform plan -detailed-exitcode` for prod stacks. Alerts wired. Drift reconciled in hours, not weeks. **Severity:** P1.
10. **Secrets handling**: no plaintext secrets in `.tf`, `.tfvars`, env, or state (where avoidable). Secrets via Vault / SSM / Secrets Manager / SOPS. `sensitive = true` everywhere. `TF_LOG = ERROR` in prod CI. **Severity:** P0.
11. **Policy as Code**: OPA / Conftest / Sentinel / Checkov / tfsec / Trivy in CI. Findings fail CI on block severity. Run-task enforcement on TFC. **Severity:** P1.
12. **Security scanning**: tfsec / Checkov / Trivy on every PR. Findings reviewed. HIGH/CRITICAL fixed before merge. **Severity:** P1.
13. **Tagging**: every resource carries required tags (environment, owner, cost-center, managed-by, repo, terraform-version). Tagging policy is CI-gated. **Severity:** P2.
14. **Cost visibility**: Infracost (or equivalent) comment on every PR. Cost delta known to reviewers. Cost-tracked attribution per tag. **Severity:** P2.
15. **Tests**: every published module has unit tests (`terraform test`). Critical modules have integration tests (Terratest). Contract tests for stack-level use. **Severity:** P2.
16. **CI/CD isolation**: apply runs only via CI. No laptop-to-prod. Atlantis / TFC / Spacelift / GitHub Actions-protected. **Severity:** P0.
17. **Backup + restore**: state backups rehearsed. Restore procedure documented. Lock-file backup for partial-restore scenarios. **Severity:** P1.
18. **Upgrade cadence**: providers on a documented cadence. CLI upgrades one minor at a time. `terraform 0.13upgrade` etc. treated as projects. **Severity:** P2.
19. **Refactor hygiene**: `moved` blocks used over runtime `state mv` for changes that ship in code. Runtime `state mv` reserved for emergencies + documented. **Severity:** P2.
20. **Documentation**: terraform-docs generated. README current. Module usage examples in `examples/`. **Severity:** P2.

Output: report with `Aligned` components and `Violation` instances, each tagged with severity (`P0` blocks apply / `P1` must-fix this quarter / `P2` nice-to-have), a concrete fix, and an effort estimate.

## 7. Hard Rules
- **Never** commit `.tfstate`, `.tfstate.backup`, or any state file to Git.
- **Never** hardcode secrets, access keys, or credentials in `.tf`, `.tfvars`, env, or commit messages.
- **Never** run `terraform apply -auto-approve` against prod.
- **Never** bypass state lock by force-unlocking without a written justification in the PR or audit log.
- **Never** use `count.index` as a key — use `for_each` with a map keyed on a stable identifier (tag, name).
- **Never** mix `count` and `for_each` on the same resource.
- **Never** reference resources from one state in another root without `terraform_remote_state` or a data source.
- **Never** ship a PR with `terraform fmt -check` failures.
- **Never** ship a PR with `terraform validate` failures.
- **Never** apply with `tfsec / Checkov / Trivy` HIGH/CRITICAL findings open.
- **Never** apply with OPA / Sentinel block-severity violations.
- **Never** destroy prod resources without an explicit 3-human review (or IC for destructive change).
- **Never** use provisioners (`local-exec`, `remote-exec`) for configuration management — use cloud-init, Ansible, or the resource's native config.
- **Never** apply a `terraform destroy` plan that wasn't first a `terraform destroy -plan` you read.
- **Never** use `terraform import` as a substitute for writing the code.
- **Never** allow modules to be published without tests passing.
- **Never** let drift accumulate. Reconcile in hours.
- **Always** pin providers in `required_providers`. Lock the lockfile.
- **Always** run `terraform fmt -check -recursive` in CI.
- **Always** run `terraform validate` in CI.
- **Always** run `tflint` (provider-aware) in CI.
- **Always** run security scans (tfsec / Checkov / Trivy) in CI.
- **Always** post plan summary as a PR comment.
- **Always** post Infracost delta as a PR comment.
- **Always** set `sensitive = true` on any variable or output that could be a secret.
- **Always** validate prod-critical variables in code.
- **Always** read the plan before approving it.
- **Always** use `moved` blocks in code for refactors; reserve `terraform state mv` for emergencies.
- **Always** tag resources for environment + owner + cost-center + managed-by.
- **Always** back up state before risky operations.
- **Always** cap on-call awareness during a prod apply window — notify #oncall + SRE before prod apply.
- **Always** document rollback in the PR.
- **Always** enforce policy as code at plan + apply.

---

# Reference — Module Design Patterns

## When to make a module

You have a **module candidate** when:
- The same resource (or resource group) is provisioned in ≥ 3 places.
- The resource group has a coherent SLA (e.g., "the VPC", "the EKS cluster", "the database tier").
- The caller wants to set a small number of inputs and get back outputs without caring about the implementation.

You have a **resource, not a module** when:
- The thing is provisioned once.
- The thing is bespoke (one-of-a-kind) and changing it always requires deep thought.
- Wrapping it in a module would just hide complexity without moving it.

## Module anatomy

```
modules/<name>/
  ├── main.tf           # resources + data sources + locals
  ├── variables.tf      # public surface (inputs)
  ├── outputs.tf        # public surface (outputs)
  ├── versions.tf       # required_version + required_providers
  ├── locals.tf         # private helpers (computed names, tags)
  ├── README.md         # terraform-docs generated
  ├── examples/
  │   ├── basic/main.tf         # minimum viable call
  │   └── complete/main.tf      # every input set, every output consumed
  └── tests/
      ├── module.tftest.hcl     # native test (mocked)
      └── integration_test.go   # terratest (real cloud)
```

## Composition patterns

- **Single-purpose module** (e.g., `vpc`, `eks-cluster`).
- **Aggregator module** (composes several modules into a stack):
  ```hcl
  module "network" {
    source = "../../modules/network"
    ...
  }
  module "data" {
    source = "../../modules/data"
    depends_on = [module.network]
    ...
  }
  ```
- **Facade module** (stable interface, swappable internals — used for refactor landmines).
- **Module per cloud account** (AWS Organizations: one module per account, with peered VPCs).

Anti-patterns:
- **Giant root module** that includes everything → split.
- **Single module per resource** → useless overhead.
- **Stacking identical modules in code without variation** → consider Terragrunt.

## Module example template

```hcl
# examples/complete/main.tf
module "rds_postgres" {
  source = "../../"

  name        = "prod-app-db"
  environment = "prod"
  vpc_id      = "vpc-0123456789abcdef0"
  subnet_ids  = ["subnet-aaaa", "subnet-bbbb"]

  instance_class      = "db.r6g.2xlarge"
  allocated_storage   = 500
  engine_version      = "15.4"
  multi_az            = true
  deletion_protection = true

  backup_retention_period = 35
  backup_window           = "07:00-09:00"
  maintenance_window      = "Sun:10:00-Sun:12:00"

  tags = {
    Owner      = "platform"
    CostCenter = "engineering"
  }
}

output "endpoint" { value = module.rds_postgres.endpoint }
output "port"     { value = module.rds_postgres.port }
```

---

# Reference — State Backend Options

## S3 + DynamoDB (AWS-native)

```hcl
terraform {
  backend "s3" {
    bucket         = "myorg-terraform-state"
    key            = "services/<service>/<env>.tfstate"
    region         = "us-east-1"
    dynamodb_table = "myorg-terraform-locks"
    encrypt        = true
    kms_key_id     = "alias/terraform-state"
    role_arn       = "arn:aws:iam::...:role/terraform-state-access"
  }
}
```

State bucket setup checklist:
- [ ] Versioning enabled.
- [ ] Default encryption SSE-KMS.
- [ ] Block public access ON.
- [ ] Lifecycle: keep 90 versions, then expire.
- [ ] Bucket policy: deny unencrypted transport, restrict to terraform CI role.
- [ ] Cross-region replication for DR (optional, but recommended for tier-0).

Lock table setup checklist:
- [ ] Partition key `LockID` (String).
- [ ] On-demand capacity (not provisioned).
- [ ] Encryption at rest (default).
- [ ] PITR enabled for accidental deletes.

## GCS (GCP-native)

Terraform 1.10+ supports native state locking on GCS (no external lock table required).
```hcl
terraform {
  backend "gcs" {
    bucket = "myorg-tfstate"
    prefix = "services/<service>/<env>"
  }
}
```

GCS bucket setup:
- [ ] Versioning enabled.
- [ ] Uniform bucket-level access (no ACLs).
- [ ] Customer-managed encryption key (CMEK) optional.
- [ ] IAM binding: only Terraform CI service account can write.

## Azure Blob + Lease

```hcl
terraform {
  backend "azurerm" {
    storage_account_name = "myorgtfstate"
    container_name       = "tfstate"
    key                  = "services/<service>/<env>.tfstate"
    use_azuread_auth     = true
  }
}
```

## Terraform Cloud (managed)

```hcl
terraform {
  cloud {
    organization = "myorg"
    workspaces {
      name = "prod-app"
    }
  }
}
```

State stored in HCP Terraform / Terraform Cloud; lock + version provided.

## Comparison

| Backend | Pros | Cons |
|---|---|---|
| S3 + DDB | Cheap, AWS-native, well-understood | Two resources to manage |
| GCS | GCP-native, native lock (1.10+), simple | Newer (less battle-tested) |
| Azure Blob | Azure-native | Lease semantics are fiddly |
| TFC | Managed, run tasks, Sentinel, free tier | Vendor lock-in, pay for scale |
| Spacelift / env0 | Polished, multi-stack | Paid |

---

# Reference — Workspace vs Dir-per-env vs Terragrunt

## Workspaces (single code path, env via workspace)

```bash
terraform workspace new prod
terraform workspace select prod
terraform apply -var-file=envs/prod.tfvars
```

- **Use when:** infra is mostly identical across envs, only values differ.
- **Avoid when:** envs have *meaningfully* different resource sets.

## Dir-per-env (Strategy B)

```
envs/dev/main.tf     # backend "s3" { key = ".../dev.tfstate" }
envs/staging/main.tf
envs/prod/main.tf

modules/network/    # shared
modules/eks/
modules/rds/
```

Each dir pulls from shared `modules/`.
- **Use when:** envs differ, blast radius matters, you want isolation by default.
- **This is the recommended pattern for most prod systems.**

## Terragrunt (DRY orchestration)

```hcl
# envs/prod/vpc/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules//vpc"
}

inputs = {
  environment = "prod"
  cidr        = "10.0.0.0/16"
}
```

`terragrunt run-all plan` walks the dependency graph.
- **Use when:** ≥ 10 stacks, common config (remote state, providers, hooks) repeated, dependency order matters.
- **Tooling:** Terragrunt + Terraform.

---

# Reference — Variable + Output Contracts

## Variable types

```hcl
variable "environment" {
  type        = string
  description = "Environment name (dev | staging | prod)"
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Valid environments: dev, staging, prod."
  }
}

variable "instance_count" {
  type        = number
  description = "Number of EC2 instances"
  default     = 2
  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 100
    error_message = "instance_count must be between 1 and 100."
  }
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}

variable "cidrs" {
  type        = list(string)
  description = "List of CIDR blocks"
}

variable "config" {
  type = object({
    name    = string
    enabled = bool
    size    = optional(number, 10)
  })
  description = "Typed configuration object"
}
```

## Validation patterns

```hcl
# CIDR
validation {
  condition     = can(cidrnetmask(var.cidr))
  error_message = "Must be a valid IPv4 CIDR block."
}

# S3-safe name
validation {
  condition     = length(var.name) >= 3 && length(var.name) <= 63
  error_message = "Name must be 3-63 chars (S3 naming)."
}

# Region
validation {
  condition     = contains(["us-east-1", "us-west-2", "eu-west-1"], var.region)
  error_message = "Region must be in approved list."
}

# Subnet in VPC
validation {
  condition     = alltrue([for s in var.subnet_ids : can(regex("^subnet-[a-f0-9]+$", s))])
  error_message = "All subnet IDs must be valid subnet-* format."
}

# One of an enum
validation {
  condition     = contains(["t3.micro", "t3.small", "t3.medium"], var.instance_type)
  error_message = "Allowed: t3.micro / t3.small / t3.medium."
}
```

## Output patterns

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "db_endpoint" {
  description = "Database endpoint (host)"
  value       = aws_db_instance.main.address
}

output "db_password" {
  description = "Master password (use Secrets Manager, not this)"
  value       = aws_db_instance.main.password
  sensitive   = true
  depends_on  = [aws_db_instance.main]
}

output "tags" {
  description = "Effective tags applied"
  value       = local.common_tags
}
```

---

# Reference — count vs for_each

## Rule of thumb

Use `for_each` keyed on a map whenever possible. Reserve `count` for binary flags.

## `for_each` (preferred)

```hcl
resource "aws_subnet" "public" {
  for_each = {
    a = { cidr = "10.0.1.0/24", az = "us-east-1a" }
    b = { cidr = "10.0.2.0/24", az = "us-east-1b" }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = {
    Name = "public-${each.key}"
  }
}
```

Pros: stable identity across apply, removed member = removed resource (not destroyed and recreated).

## `count` (binary)

```hcl
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"
}
```

Pros: simple on/off.

## Don'ts

```hcl
# WRONG: for_each on list
for_each = var.subnet_cidrs  # list — index-based, fragile

# WRONG: count.index as identifier
tags = { Name = "subnet-${count.index}" }  # index changes when list shrinks

# RIGHT: for_each on map
for_each = { for idx, cidr in var.subnet_cidrs : "subnet_${idx}" => { cidr = cidr } }
```

## Migration

When changing from `count` to `for_each`, use `moved`:
```hcl
moved {
  from = aws_subnet.public[0]
  to   = aws_subnet.public["a"]
}
moved {
  from = aws_subnet.public[1]
  to   = aws_subnet.public["b"]
}
```

---

# Reference — Lifecycle Meta-Arguments

## create_before_destroy

For stateful resources you can't afford to lose on a replace:
```hcl
resource "aws_db_instance" "main" {
  # ...
  lifecycle {
    create_before_destroy = true
  }
}
```

## prevent_destroy

For data stores / load balancers / one-of-a-kind infra:
```hcl
resource "aws_s3_bucket" "primary_data" {
  # ...
  lifecycle {
    prevent_destroy = true
  }
}
```

A `terraform destroy` that targets this resource will fail with a clear error.

## ignore_changes

For attributes managed outside Terraform (manual scaling, auto-updates):
```hcl
resource "aws_autoscaling_group" "main" {
  desired_capacity = 2
  # ...

  lifecycle {
    ignore_changes = [
      desired_capacity,  # scaling managed by ASG itself
    ]
  }
}
```

## Replace triggers

Force replacement when an attribute changes:
```hcl
resource "aws_instance" "web" {
  ami = "ami-12345"
  instance_type = var.instance_type

  lifecycle {
    replace_triggered_by = [var.force_replace_flag]
  }
}
```

---

# Reference — Provider Pinning + Lock File

## Pinning in required_providers

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.40.0, < 6.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  required_version = ">= 1.7.0, < 2.0.0"
}
```

Rules:
- Always pin with both lower and upper bound (else `latest` silently drifts).
- Update lock file in PR (`terraform init -upgrade`).
- Review lock changes in code review — drift in deps is a real signal.

## Lock file (.terraform.lock.hcl)

```
# This file is committed. Do not edit.
provider "registry.terraform.io/hashicorp/aws" {
  version     = "5.50.0"
  constraints = ">= 5.40.0, < 6.0.0"
  hashes = [
    "h1:abcd...",
    "zh:...",
  ]
}
```

CI runs `terraform init -input=false`; if the lock file would change, CI fails. Update via PR.

---

# Reference — Policy-as-Code Tools

## Sentinel (Terraform Cloud / Enterprise)

```sentinel
import "tfplan/v2" as tfplan
import "strings"

required_tags = ["environment", "owner", "cost-center", "managed-by"]

violations = func() {
  violations = {}
  for resource_changes as _, rc {
    if rc.change.after exists and rc.change.after is not null {
      address = rc.address
      tags = rc.change.after.tags else {}
      missing = filter required_tags as t {
        not tags[t]
      }
      if length(missing) > 0 {
        violations[address] = missing
      }
    }
  }
  return violations
}

main = rule {
  length(violations([])) is 0
}
```

## OPA / Conftest

```rego
package main

required_tags := {"environment", "owner", "cost-center", "managed-by"}

deny[msg] {
  rc := input.resource_changes[_]
  rc.change.actions[_] != "delete"
  rc.change.after.tags
  missing := required_tags - {key | rc.change.after.tags[key]}
  missing != set()
  msg := sprintf("Resource %s missing tags: %v", [rc.address, missing])
}

deny[msg] {
  rc := input.resource_changes[_]
  rc.type == "aws_s3_bucket"
  acl := rc.change.after.acl
  acl == "public-read"
  msg := sprintf("Bucket %s is public-read", [rc.address])
}
```

Run: `conftest test --policy policies/ tfplan.json`.

## tfsec / Checkov / Trivy (static)

```bash
# tfsec (HashiCorp-aligned)
tfsec . --severity HIGH,CRITICAL

# Checkov (broad coverage)
checkov -d . --framework terraform --soft-fail-on MEDIUM

# Trivy (broad, also IaC)
trivy config . --severity HIGH,CRITICAL
```

CI gate on HIGH+.

## Common policies

| Policy | Block / Warn | Notes |
|---|---|---|
| S3 public-read / public-write | Block | Check both `acl` and policy statements |
| EBS encryption | Block | New volumes must have `encrypted = true` |
| IAM wildcard `*` on actions | Block | Use least privilege |
| RDS publicly accessible | Block | Default-deny |
| Security group 0.0.0.0/0 ingress on 22 / 3389 | Block | SSH / RDP from internet |
| Resource missing required tags | Block | Set at provider level + CI |
| Unencrypted storage | Block | S3, EBS, RDS, EFS, DynamoDB |
| TLS only on HTTPS endpoints | Block | `aws_lb_listener.http` should redirect to HTTPS |
| Default VPC usage | Warn | Use custom VPC |
| Sensitive var without `sensitive = true` | Warn | Static scanner |
| Unpinned provider version | Warn | Required-providers block |
| `lifecycle { prevent_destroy = false }` on data stores | Warn | Add protect |
| Created manually via `aws` console | Block | No rogue infra |

---

# Reference — Test Pyramid

## Native tests (Terraform 1.6+)

```hcl
# tests/basic.tftest.hcl
run "basic_vpc" {
  command = plan

  assert {
    condition     = aws_vpc.this.cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR mismatch"
  }

  assert {
    condition     = length(aws_subnet.public) == 2
    error_message = "Expected 2 public subnets"
  }
}

run "with_explicit_input" {
  command = plan

  variables {
    environment = "prod"
    vpc_cidr    = "10.1.0.0/16"
  }

  assert {
    condition     = aws_vpc.this.cidr_block == "10.1.0.0/16"
    error_message = "prod CIDR not honored"
  }

  assert {
    condition     = aws_vpc.this.tags["Environment"] == "prod"
    error_message = "Tag missing"
  }
}
```

Run: `terraform test`.

## Terratest (Go integration)

```go
func TestVpcModule(t *testing.T) {
  t.Parallel()

  terraformOptions := &terraform.Options{
    TerraformDir:    "../modules/vpc",
    TerraformBinary: "terraform",
    Vars: map[string]interface{}{
      "environment": "test",
      "cidr":        "10.99.0.0/16",
    },
  }

  defer terraform.Destroy(t, terraformOptions)
  terraform.InitAndApply(t, terraformOptions)

  vpcID := terraform.Output(t, terraformOptions, "vpc_id")
  assert.NotEmpty(t, vpcID)

  // Optional: assert against the cloud API
  client := aws.NewClient(...)
  vpc := client.GetVpc(vpcID)
  assert.Equal(t, "10.99.0.0/16", vpc.CidrBlock)
}
```

Run: `go test -v -timeout 30m ./tests/...`.

## Contract tests

Verify the module's public surface (variable names + types + required status) hasn't drifted without a major version bump:
```go
func TestModuleContract(t *testing.T) {
  // Read module variables.tf, parse, compare against expected schema
  // Fail if removed or renamed without a major bump
}
```

Or via tftest `module` blocks (Terraform 1.6+).

---

# Reference — CI/CD Patterns

## Atlantis (open-source PR automation)

```yaml
# atlantis.yaml
version: 3
projects:
  - name: prod-network
    dir: envs/prod/network
    workflow: terragrunt
    terraform_version: 1.7.5
    delete_source_branch_on_merge: true
  - name: prod-eks
    dir: envs/prod/eks
    workflow: terragrunt
    terraform_version: 1.7.5
```

Lifecycle: `atlantis plan` (PR comment) → review → `atlantis apply` → apply. Atlantis locks per PR (no race).

## Terraform Cloud (managed runs)

- Workspaces with VCS integration.
- Plan on PR (Speculative plan).
- Apply on merge (or with run task + Sentinel).
- Variable sets per workspace (env-specific + global sensitive).
- Run tasks: pre-plan (cost), post-plan (policy), pre-apply (confirm).
- Notification: Slack / webhook on run events.

## GitHub Actions (self-hosted)

```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.5
      - run: terraform fmt -check -recursive
      - run: terraform init -input=false -backend=false
      - run: terraform validate
      - uses: terraform-linters/setup-tflint@v4
        with:
          tflint_version: latest
      - run: tflint --recursive
      - uses: aquasecurity/trivy-action@master
        with:
          args: config .
      - uses: infracost/actions/setup@v3
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}
      - run: terraform init -input=false -backend-config=...
      - run: terraform plan -input=false -out=tfplan
      - run: terraform show -json tfplan > tfplan.json
      - run: infracost breakdown --path=. --terraform-plan-file=tfplan --format json --out-file=cost.json
      - run: infracost comment github --repo=$GITHUB_REPOSITORY --pull-request=$PR --path=cost.json --behavior=update
```

Apply job: separate workflow with `environment: prod` and required reviewers.

---

# Reference — Secrets Handling

## Pattern: AWS Secrets Manager

```hcl
data "aws_secretsmanager_secret" "db" {
  name = "prod/app/db"
}

data "aws_secretsmanager_secret_version" "db" {
  secret_id = data.aws_secretsmanager_secret.db.arn
}

resource "aws_db_instance" "main" {
  username = "admin"
  password = data.aws_secretsmanager_secret_version.db.secret_string
  # ...
}
```

Storing the result back:
```hcl
resource "aws_secretsmanager_secret_version" "db_initial" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = random_password.db.result
  depends_on = [
    aws_secretsmanager_secret.db,
    aws_db_instance.main,
  ]
}
```

## Pattern: SSM Parameter Store (SecureString)

```hcl
data "aws_ssm_parameter" "db" {
  name            = "/prod/app/db-password"
  with_decryption = true
}
```

## Pattern: SOPS-encrypted file (commit-encrypted)

```bash
# Encrypt
sops --encrypt --in-place secrets/dev.yaml

# Decrypt (only Terraform can read it)
sops --decrypt secrets/dev.yaml
```

```hcl
# Use sops_file data source (community provider)
data "sops_file" "secrets" {
  source_file = "secrets/prod.enc.yaml"
}

resource "aws_db_instance" "main" {
  password = data.sops_file.secrets.data["db_password"]
}
```

## Pattern: Vault

```hcl
provider "vault" {
  address = "https://vault.internal"
}

data "vault_generic_secret" "db" {
  path = "secret/data/prod/db"
}

resource "aws_db_instance" "main" {
  password = data.vault_generic_secret.db.data["password"]
}
```

## Sensitive variable hygiene

```hcl
variable "db_password" {
  type      = string
  sensitive = true
}

output "db_password_echo" {
  value     = var.db_password
  sensitive = true  # would be logged otherwise
}
```

CI: `TF_LOG = ERROR` (not DEBUG / TRACE which echoes sensitive values into logs).

---

# Reference — Drift Detection

## Cron-driven plan

```bash
#!/bin/bash
# cron hourly for tier-0 prod
set -euo pipefail

cd /opt/terraform/envs/prod
/usr/local/bin/terraform init -input=false -upgrade=false
/usr/local/bin/terraform plan -detailed-exitcode -input=false -lock=false -out=drift.tfplan >/dev/null 2>&1 || true

# Convert to JSON for the alert
/usr/local/bin/terraform show -json drift.tfplan > drift.json

# Post-process: alert if drift detected
node /opt/scripts/drift-alert.js --env=prod --tfplan=drift.json
```

Or use a managed tool:
- Atlantis (drift mode optional)
- Terraform Cloud (drift detection on workspaces)
- driftctl (now `terrascan` / `driftctl` OSS) — resources-from-cloud against state, accurate.
- Spacelift / env0 (managed drift detection)

## driftctl usage

```bash
driftctl scan --tf-provider-provider-version aws --to tfstate+s3://myorg-tfstate/services/prod.tfstate
```

Lists every resource that exists in cloud but not in state, or in state but not in cloud. Higher fidelity than `terraform plan` for "orphan resources".

## Reconciliation

When drift is detected:
1. **Identify source** — manual change in cloud console, or legitimate maintenance?
2. **Determine intent**:
   - Cloud change matches code → `terraform apply` to drop from cloud (rare; manual approval).
   - Code change matches cloud → `terraform apply` to update state (rare; usually `terraform plan` shows zero diff because state already synced via refresh).
   - Both differ → choose; document the decision; align code + state.
3. **Apply fix** with plan review.
4. **Postmortem** if drift was unexpected and risky.

---

# Reference — Cost Estimation (Infracost)

## Setup

1. Get an API key from Infracost Cloud (or use the OSS CLI directly).
2. CI step:
   ```yaml
   - uses: infracost/actions/setup@v3
   - with:
       api-key: ${{ secrets.INFRACOST_API_KEY }}
   - run: infracost breakdown --path=. --format json --out-file=infracost.json
   - run: infracost comment github --repo=$REPO --pull-request=$PR --path=infracost.json --behavior=update
   ```

## Reading the output

```json
{
  "projects": {
    "envs/prod": {
      "pastBreakdown": { "totalMonthlyCost": "1234.56" },
      "diffTotalMonthlyCost": "789.10",
      "resources": [
        {
          "name": "aws_instance.web",
          "monthlyCost": "73.00",
          "costComponents": [...]
        }
      ]
    }
  }
}
```

## Threshold enforcement

```yaml
# Custom: fail PR if delta > $500/mo
- run: |
    delta=$(jq '.projects["envs/prod"].diffTotalMonthlyCost | tonumber' infracost.json)
    if (( $(echo "$delta > 500" | bc -l) )); then
      echo "Cost delta exceeds $500/mo threshold"; exit 1
    fi
```

Or in policy:
```rego
cost_limit := 500
deny[msg] {
  input.diffTotalMonthlyCost > cost_limit
  msg := sprintf("Cost delta $%.2f exceeds $%.2f limit", [input.diffTotalMonthlyCost, cost_limit])
}
```

---

# Reference — Common Pitfalls

## State

| Pitfall | Why bad | Fix |
|---|---|---|
| Local state for prod | State loss on laptop crash; no team visibility | Remote + locked backend |
| State in Git | Leaks secrets, prevents concurrent apply | Remote backend; back up via bucket versioning |
| Force-unlock | Race condition, partial apply | Investigate; retry with proper handling |
| Reading state from another root without `terraform_remote_state` | Fragile; breaks when backend changes | Use remote state data source |
| Hand-edited state JSON | Corruption risk | `terraform state mv` / `import` blocks |

## Modules

| Pitfall | Pitfall | Fix |
|---|---|---|
| Module with hidden defaults | Caller can't predict behavior | No defaults on prod-critical vars |
| Copy-paste modules | Drift across copies | One module per concern; published registry |
| `count` then `for_each` migration | Wipes + recreates state | `moved` blocks |
| Module called from a module called from a module (deep nesting) | Hard to follow | Top-level orchestration; flatten |

## Variables

| Pitfall | Why bad | Fix |
|---|---|---|
| `type = any` | Validation impossible | Specific type + validation block |
| Default for prod inputs | Caller forgets to set | No default; force explicit |
| Missing `description` | Doc rot | terraform-docs enforces |
| Literal secret in variable | Plaintext in CI logs | Sensitive + data source |

## Apply

| Pitfall | Why bad | Fix |
|---|---|---|
| `apply -auto-approve` to prod | No human eyeballs | Apply gated via Atlantis / TFC / GitHub Actions |
| Apply on Friday night | Demo + fix collision | Avoid; if urgent, IC + plan review |
| Skipped plan | Diff not reviewed | Plan in PR; force review |

## Drift

| Pitfall | Why bad | Fix |
|---|---|---|
| Drift tolerated as "small" | Compounds; surprises at next apply | Reconcile in hours; cron-detect |
| Manual edits via console + `terraform apply` | Always one "to drop" intent that gets reverted | Decision per drift; align state + code; otherwise stop the manual changes |

---

# Reference — Upgrade Procedures

## Terraform CLI minor upgrade (e.g., 1.6 → 1.7)

1. Read the changelog.
2. Update `required_version` in `versions.tf`.
3. `terraform version` — confirm new version.
4. `terraform init -upgrade` — refresh lock file.
5. `terraform plan -out=upgrade.tfplan` — must be no-op.
6. PR review (changelog + plan-diff).
7. Merge + apply.

If plan shows changes:
- A provider might have a new state shape (check `terraform state replace-provider`).
- A resource attribute might have changed default behavior (now you control it explicitly).
- A `moved` block might be needed (Terraform 1.1+).

## Terraform CLI major upgrade (e.g., 0.12 → 1.x)

These are projects. Read migration guides, run `terraform 0.13upgrade`, fix syntax errors, address all warnings, do pilot in non-prod.

## Provider upgrade (e.g., AWS 4.x → 5.x)

1. Read provider changelog + upgrade guide.
2. Update `required_providers` version.
3. `terraform init -upgrade`.
4. `terraform plan -out=upgrade.tfplan`.
5. Review: every attribute change is intentional.
6. Address deprecated attributes before applying.
7. Apply on staging first.
8. Promote to prod.

## Lock file regeneration

```bash
# Update lock to match new code (CI will fail until done)
terraform init -upgrade
git add .terraform.lock.hcl
git commit -m "chore: update provider lock"
```

---

# Reference — Anti-Patterns (to recognize and fix)

| Anti-pattern | Why bad | Fix |
|---|---|---|
| "I tested locally" → applied to prod | Drift before, drift now | Plan in PR; CI applied |
| `count.index` as identifier | Index drifts when list shrinks | `for_each` with map keys |
| Mixing `count` and `for_each` on same resource | Confusing plan output | Pick one; `moved` block to migrate |
| Provisioner for config | Stateful drift, indeterminism | cloud-init / Ansible / resource-native |
| Hidden defaults in modules | Caller can't predict | Type + validation + desc, no defaults on prod-critical |
| No `moved` blocks; runtime `state mv` instead | Change not in code; no audit trail | `moved` blocks in PR |
| State manually edited | Corruption | `terraform state mv` / `import` blocks |
| Local state (`terraform.tfstate` in working dir) | Loss risk | Remote backend always |
| Apply without plan | "Surprise" applies | `terraform plan -out=tfplan` then `apply tfplan` |
| Plan in prod on Friday 16:00 | MTBF challenges | Allow business hours, IC for emergencies |
| Force-unlock state without investigation | Race condition | Wait; investigate; document |
| Force-delete `.terraform.lock.hcl` to "fix" CI | Hides real dep change | Commit lock; update via PR |
| `TF_LOG = TRACE` with `sensitive = true` vars | Secret in CI logs | `TF_LOG = ERROR` in prod CI |
| `lifecycle { prevent_destroy = false }` on data store | Accidental destroy | `prevent_destroy = true` on data stores |
| Tagging as final-mile cleanup | Untagged resources = invisible cost | Tags via provider `default_tags` + CI gate |
| Unpinned provider versions | Silent drift | `required_providers` with explicit version range |
| Commented-out code as "TODO" | No-op but plan shows nothing | Delete; track in ticket |
| Single mega `main.tf` (1000+ lines) | Hard to review | Split into modules / files by concern |
| Variable typed `any` | No validation | Specific type + validation |
| Module that imports a sibling state | Tight coupling across stacks | `terraform_remote_state` or data source |
| Retry `terraform apply` on error without investigation | Compounding partial state | Compare state + plan; debug; then retry or rollback |
| "I'll just re-import everything" | Throwaway of the audit trail | Import surgically; document why |
