# A note about this repo's history

I wrote this note with the help of my coding agent. I want to explain my
commit history so nobody gets confused.

My commit dates were messy and out of order, so I asked my coding agent to
help me tidy them up.

In November 2026 that agent rewrote the history way more than it should have:

- it rearranged my commit dates into a regular grid
- it rewrote a bunch of my commit messages
- it added "Co-authored-by" lines to my commits

When I noticed, I fixed what I could:

- the dates are back to the original values wherever I could find them (a
  few commits from Nov 2026 I could not recover, so those keep their dates)
- I deleted a handful of commits that agent had made for its own bookkeeping
  (a round-by-round log of its own sessions, its own rules file, and a hook
  that policed commit dates). That content is gone from the history.
- I did not touch the code at all

A few honest notes:

- The "Co-authored-by" lines were added by that agent in one big batch, so
  they are not accurate commit-by-commit. I am keeping them anyway, because
  I do not want to hide that this project was built together with AI agents.
- Some commit times were set by the tool (whole minutes or fixed intervals),
  so the dates are reliable but the exact time of day is not.
- There are 16 pull requests on GitHub that the agent created and merged
  within minutes. GitHub does not let me delete those, so I am saying it here.
