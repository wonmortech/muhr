# Governance

Muhr is a project of [Wonmor](https://wonmor.io), run in the public `wonmortech` GitHub organization.

## Roles

| Role | Who | Can do |
|---|---|---|
| Maintainer | [@wonmors](https://github.com/wonmors), [@XakimovNosirbek](https://github.com/XakimovNosirbek) | Review and merge pull requests, triage issues, cut releases, handle security reports |
| Contributor | Anyone who opens an issue or a pull request | Propose changes; becomes a maintainer after sustained, reviewed contributions and the maintainers' agreement |

The `core` team of the organization holds admin rights; `maintainers` and `contributors` teams map to the roles above.

## Decisions

Day-to-day decisions are made in issues and pull requests. A change merges after review and green CI
([CONTRIBUTING.md](CONTRIBUTING.md)). Larger decisions (scope, licence, architecture, anything in
[docs/PLAN.md](docs/PLAN.md)) are proposed in an issue, stay open for at least 7 days for comments, and are
recorded in the plan. When maintainers disagree, the project lead (@wonmors) decides and writes down why.

## Continuity

We say this openly: both maintainer accounts above currently belong to the founder, so the project does not
yet have an independent second person with access. Continuity today relies on:

- the account recovery settings of the `wonmortech` organization and of its owner accounts, so access to the
  repository, the domain configuration and the deployment secrets can be restored;
- automated deployment from `main` ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)), so no single
  machine is needed to publish, and a public repository that anyone can fork under the Apache-2.0 licence.

Adding an independent second owner is an open goal; see [Open goals](#open-goals).

## Open goals

- **An independent second owner.** A person other than the founder who holds owner rights in the organization
  and can publish the site and handle security reports. Until then, the bus factor of the project is one.
- **More active maintainers.** Contributors become maintainers as described under [Roles](#roles).

## Security

Vulnerability reports follow [SECURITY.md](SECURITY.md). Only maintainers see private advisories.
