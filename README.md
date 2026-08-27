Carinex — full reconstructed project

This is a complete, real Next.js + Tailwind + Supabase project — not bolt's
version. It's built from your original uploaded scaffold (real Navbar,
layout, globals.css, Supabase client/server pattern, and richer
specialization content pulled from your actual catalog docs) plus the new
pieces: /login, /signup, /dashboard, and your real logo.


No shadcn/ui dependency — everything is plain Tailwind using your actual
carinex-navy/emerald/white/gray/yellow tokens, so there's nothing fragile
to misconfigure.


Upload order (GitHub → Add file → Create new file)

Create each file below by pasting its exact path into GitHub's filename
box (typing a path with slashes auto-creates the folders) and pasting its
content into the editor. Order matters for a couple of these — later files
assume earlier ones exist — so go top to bottom.



.gitignore

.env.local.example

package.json

next.config.js

tsconfig.json

postcss.config.js

tailwind.config.ts

app/globals.css

app/layout.tsx

lib/supabase/client.ts

lib/supabase/server.ts

lib/data.ts

components/Navbar.tsx

components/Footer.tsx

components/Hero.tsx

components/PathwayCard.tsx

components/ComingSoon.tsx

components/OpportunityCard.tsx

components/SignUpForm.tsx

components/LoginForm.tsx

components/LogoutButton.tsx

app/page.tsx

app/pathways/page.tsx

app/signup/page.tsx

app/login/page.tsx

app/dashboard/page.tsx

app/api/payments/webhook/route.ts

public/carinex-logo.svg


After all files are in


On Vercel: import the repo, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as environment variables (from Supabase → Project Settings → API), deploy.

In Supabase → Authentication → URL Configuration: update Site URL and Redirect URLs to your real Vercel domain once you have it (they're probably still pointing at localhost from earlier setup).


What's dormant on purpose (Phase 2/3, not a bug)


components/OpportunityCard.tsx and the opportunities array in lib/data.ts — not rendered anywhere yet. The homepage shows <ComingSoon /> in that spot instead.

app/api/payments/webhook/route.ts — a working Paystack webhook, not wired to anything live yet since there's no job-posting fee flow.


Both are ready to switch on later with no backend work needed — your
Supabase jobs, employer_profiles, and payments tables already exist.

