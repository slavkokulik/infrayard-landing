# Troubleshooting and support

Start with the failing operation's execution logs and the affected cluster's detail page. Preserve the error and operation time before retrying. Confirm the actual OCI resource state before attempting a second infrastructure operation.

## Missing versions or shapes

In **Admin → Configuration**, sync shapes and Kubernetes versions from OCI for the configured region. Newly discovered Kubernetes versions must be enabled by an administrator. The selected VM shape needs a compatible OKE node image.

Compatibility lookup fails closed: an unavailable lookup can block deployment even if a version is enabled. Check runner credentials, OCI policies and API connectivity. If shape sync is unavailable, existing shape configuration remains in place for manual review.

An administrator with an appropriately configured OCI CLI can inspect the current options:

```bash
oci ce node-pool-options get --node-pool-option-id all --profile <PROFILE>
```

Use region-appropriate results; do not copy a stale shape or image allowlist from another tenancy.

## Existing-network validation fails

- An existing subnet requires an existing VCN reference.
- The selected compartment must be within the installation's anchor scope.
- Reusing a compartment alone does not discover its VCN or subnets.
- Existing network resources need prepared routing and permissions.
- Restricted public endpoint mode is not supported with every read-only BYON combination.

Review the [networking combinations and ownership rules](/docs/networking/) before changing permissions or resources.

## Workers do not become ready

Inspect the OCI and Terraform error output, tenancy quotas, regional capacity and shape/image compatibility. For BYON private worker subnets, confirm the required egress path to OCI services. Network resources supplied by the customer are not automatically repaired by Infrayard.

## Kubeconfig downloads but kubectl cannot connect

The kubeconfig supplies authentication, not routing. Check VPN or private-network access, endpoint mode and the configured TCP/6443 allowlist. Both the runner and relevant client networks need reachability. A downloaded file does not bypass a private endpoint or firewall.

## A limit prevents a request

Check the global default, per-user override and selected template. Submit a limit-increase request where offered; administrators can grant or adjust the values in the Requests queue. Approved templates can define pre-approved resource values that exceed a user's custom-configuration limits.

## Login or role visibility is incorrect

Check the configured OIDC issuer, redirect addresses and role claims for the supplied release. Confirm admin and template role mapping. A user without a required template role will not see that template. Changes to limits are reflected on the next relevant load; a role change can require a fresh identity session.

## Images cannot be pulled

Verify the released image references, registry entitlement, `imagePullSecrets` and network access to the approved registry or mirror. Contact support if a supplied registry credential has expired. Do not publish registry tokens in logs or screenshots.

## A lifecycle operation fails

Inspect the run output and OCI state. Failed deployments can expose a cleanup action for partial resources. Confirm what exists and what the action will remove before using it. For Basic clusters, review the required worker refresh after per-node changes or Kubernetes upgrades.

Avoid manual edits to Infrayard-managed resources as a routine repair: the next Terraform apply can overwrite them. Where incident intervention is necessary, coordinate state reconciliation before running further jobs.

## Contact support

Email [support@infrayard.eu](mailto:support@infrayard.eu) or [open the support form](/?enquiry=support#demo). Include:

- The installed Infrayard release and deployment option.
- The affected operation, approximate timestamp and region.
- The observed result and a sanitised error excerpt.
- Relevant recent changes and steps already attempted.

Remove private keys, access tokens, passwords, customer data and unnecessary identifiers before sharing diagnostics. Response targets, support hours and escalation arrangements are defined by your subscription agreement. For additional support requirements, [discuss Enterprise](/?enquiry=enterprise#demo).
