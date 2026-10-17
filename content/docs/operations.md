# Operations, upgrades and recovery

The customer operates the Infrayard installation and the cloud environment around it. This page defines the operating areas to cover. Use the deployment and upgrade runbook for your supplied release for exact commands, supported versions and migration steps.

## Responsibilities

| Area | Operating responsibility |
| --- | --- |
| Kubernetes host, ingress, TLS, storage and network | Customer, with deployment assistance if agreed |
| OCI IAM and API credentials | Customer |
| PostgreSQL and Terraform state backup | Customer |
| Workload deployment, application backup and availability | Customer |
| Infrayard release images, documentation and contracted support | Solvia Lab |
| Extra rollout or incident assistance | As scoped in the support agreement |

## Before a platform upgrade

1. Record the installed image versions or digests, Helm release and customer values.
2. Review the target release notes, compatibility requirements and any database migration guidance supplied with the release.
3. Back up PostgreSQL, required deployment configuration and secrets using your approved tools. Preserve access to the related Terraform state in OCI Object Storage.
4. Avoid scheduling a platform upgrade while cluster lifecycle jobs are running.
5. Test the target release in a non-production installation where possible.
6. Agree a maintenance window, validation plan and release-specific recovery procedure.

Use the pinned, released image references supplied for the upgrade. Customer operators consume images; they do not need the product source code or maintainer build pipelines.

## Validate after an upgrade

- Sign in as an administrator and a representative regular user.
- Check role and template visibility, global limits and per-user overrides.
- Confirm cluster inventory, Activity history and audit records are available.
- Verify state-backend and OCI connectivity.
- Validate a suitable non-production lifecycle workflow before allowing wider changes.

## Backups and recovery

Back up the database, relevant Helm values, necessary secrets and Terraform state under your organisation's retention and access controls. These contain different parts of the platform and need a consistent recovery plan.

Define backup frequency, recovery point and recovery time requirements before production. Test restoring into an isolated environment. Do not assume that reinstalling Helm, reverting an image or recovering a single database snapshot will safely undo an infrastructure operation or database migration.

During recovery, reconcile the restored metadata and state with the resources actually present in OCI before starting new jobs. Do not run competing Terraform operations against the same state.

This public guide does not claim a built-in backup service, one-click rollback, or a particular recovery SLA. Any assisted recovery and response commitment is defined in your support agreement.

## OKE and workload operations

An Infrayard platform upgrade and an OKE Kubernetes upgrade are separate changes. Worker refresh, disruption budgets, capacity, temporary scaling cost and application availability must be considered when scheduling OKE changes. See [cluster lifecycle](/docs/cluster-lifecycle/).

## Ending a subscription

Arrange the supported handover of required configuration, access and state before the commercial access period ends. Ending a software subscription does not stop Oracle Cloud billing for resources left running. Subscription entitlements and the offboarding procedure are governed by your agreement; see [billing and licensing](/docs/subscription/#cancellation-and-offboarding).
