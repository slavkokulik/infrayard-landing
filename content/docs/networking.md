# Networking and existing infrastructure

Choose the endpoint model and ownership boundary before deployment. Kubernetes access files provide authentication; your runner and users still need a working network path.

## Default setup

By default, Infrayard creates a full network stack per cluster:

- A **VCN** with a /16 range derived from the cluster's /24 CIDR
- A **private worker subnet** (/24)
- A **public Kubernetes API endpoint subnet** when public restricted API access is enabled
- A **public load balancer subnet** for Kubernetes `LoadBalancer` services
- Internet Gateway, NAT Gateway, Service Gateway, and route tables for public/private paths
- Security lists with OKE-required ingress/egress rules plus API endpoint TCP/6443 allowlist rules

## Kubernetes API endpoint access

Admin Configuration includes **Kubernetes API Access**:

- **Private endpoint** keeps the OKE API on a private subnet. Infrayard and kubectl clients need an existing private route, VPN, or bastion path.
- **Public endpoint restricted by CIDR allowlist** creates a dedicated public API endpoint subnet and allows TCP/6443 only from configured CIDRs. Add both the Infrayard runner egress IP/range and company VPN/corporate egress ranges. `0.0.0.0/0` is rejected.

This is the supported path when DRG is too costly and LPG does not scale past the per-VCN peering limit. Users still need to be on the corporate/VPN network for `kubectl`.

## Bringing your own network

Users can supply existing OCIDs via the **Advanced tab** in the deploy form. Infrayard skips creating whichever resources are already provided:

| Override | Effect |
|---|---|
| Existing VCN OCID | Uses your VCN — skips VCN, IGW, gateway, and route table creation; generated subnets use the VCN's existing/default routing |
| Existing Compartment OCID | Places resources in your compartment — skips compartment creation |
| Existing Subnet OCID | Places nodes in your subnet — requires Existing VCN OCID, and skips subnet and security list creation |

Supported private-endpoint combinations:

| Combination | Behavior |
|---|---|
| No overrides | Infrayard creates and manages the compartment, VCN, subnets, gateways, route tables, and security lists |
| Existing Compartment OCID only | Infrayard creates a new managed VCN/network stack inside that compartment |
| Existing VCN OCID, with or without Existing Compartment OCID | Infrayard reuses the VCN and creates cluster subnets/security lists inside it; existing VCN gateways and route tables are not managed |
| Existing VCN OCID + Existing Subnet OCID, with or without Existing Compartment OCID | True BYON networking: Infrayard creates OKE/node-pool resources and references the supplied network read-only |
| Existing Subnet OCID without Existing VCN OCID | Unsupported and rejected before Terraform starts |

**Compartment subtree rule.** `Existing Compartment OCID` must be a descendant (any depth) of the **anchor compartment** chosen at install time — the compartment Infrayard uses as the parent for new cluster compartments. The anchor is whatever existing compartment you point us at; it does not have to be a dedicated Infrayard-owned compartment. Direct children, grandchildren, and the anchor itself are all accepted. Siblings, ancestors, or compartments in unrelated subtrees are rejected with a 400 *before* Terraform starts — without this guard the deploy would fail mid-`terraform apply` with a confusing IAM error, because the runner's `manage` policies are scoped to the anchor subtree. Non-existent OCIDs return "compartment not found"; if OCI is briefly unreachable for the validation call, the API returns 503 so the deploy can simply be retried.

The anchor is a knob, not a fixture. Pick the layout that matches your tenancy posture:

- **Tenancy root anchor.** No new compartments, nothing to rearrange — the entire tenancy is BYON-eligible. Right for "we don't want Infrayard adding any hierarchy on top of what we already have." Trade-off: the runner's IAM group needs `manage` permissions at tenancy scope (or scoped to the relevant resource families).
- **Anchor at an existing org compartment.** Slot Infrayard into a `platforms`, `production`, or `infra` compartment you already maintain. BYON works for anything under it, including peer compartments that already existed there. You don't have to create a new compartment to enable Infrayard.
- **Dedicated anchor compartment.** Create one (e.g. `infrayard`) for explicit blast-radius isolation. Functionally identical to the previous case, just a narrower IAM scope.

The single-install pattern that's *not* supported today is "one Infrayard spanning multiple unrelated subtrees of the same tenancy." That posture requires either tenancy-wide grants (use the tenancy-root anchor) or two installs.

Restricted public API endpoint mode requires Infrayard-managed networking when `Existing VCN OCID` or `Existing Subnet OCID` would otherwise make the network read-only.

Important behavior: `Existing Compartment OCID` does **not** auto-discover an existing VCN or subnet from that compartment. If VCN/subnet fields are left empty, Infrayard creates a new VCN/subnets/network stack inside the provided compartment.

Advanced override UX guardrails: OCID fields validate type prefixes (`ocid1.vcn.`, `ocid1.compartment.`, `ocid1.subnet.`) and provide OCI-backed autocomplete lists for compartments, VCNs, and subnets.

> Shared compartment guidance: if you want multiple clusters in one compartment, use a dedicated BYO compartment via `Existing Compartment OCID` for all those clusters. Do not reuse a compartment that was auto-created for another cluster as a shared target.

> Note: If you deploy with existing VCN/subnet overrides, Infrayard does not manage route tables for those existing resources. Your existing network must already provide equivalent private-subnet egress required for OKE worker node registration: route `0.0.0.0/0` to a NAT Gateway (or equivalent corporate egress path) and route `all-<region>-services-in-oracle-services-network` to a Service Gateway. This is a routing requirement, not an "open ingress" security rule.

> ⚠️ **Drift behaviour.** Infrayard-created VCN, subnet, IGW, route table, and security list resources are fully managed by the cluster's Terraform state — manual edits in the OCI Console will be overwritten on the next apply. Supplied BYO resources (existing VCN / subnet / compartment) are referenced read-only and never modified.

## Custom security rules

Infrayard's default security list covers the ports required by OKE. For custom ingress/egress rules — exposing specific node ports, restricting egress to corporate CIDRs, or integrating with existing NSGs — the recommended approach is to **bring your own subnet** via the Advanced tab with your security configuration already applied. Infrayard uses your subnet and skips creating its own security list entirely, giving your network team full control without adding UI complexity.

## Pre-deployment review

Confirm the chosen endpoint mode, runner and client routes, anchor compartment, OCI policies, DNS and required service egress. Test reachability from the actual runner and authorised client network. Do not treat a VPN label or an existing subnet as proof that all routes are ready.

See [installation](/docs/installation/) and [security and access](/docs/security/).
