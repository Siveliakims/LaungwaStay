LUANGWASTAY — MULTI-PAGE STARTER
================================

This ZIP contains a multi-page HTML/CSS/vanilla JavaScript frontend for LuangwaStay.

IMPORTANT
---------
1. Extract the ZIP.
2. Open the extracted LuangwaStay folder in Acode.
3. Open js/supabase-config.js and enter your EXISTING Supabase project URL and anon/public key.
   Never put a service_role key in this website.
4. Open the website using a local web server or deploy the folder to a static host.
   Supabase ES modules and authentication redirects may not work correctly from file://.
5. Read SUPABASE-INTEGRATION.txt before connecting live data.

EXISTING DATABASE
-----------------
The project is designed around the existing Supabase project and these 14 tables:
profiles, owner_accounts, properties, property_images, rooms, amenities,
property_amenities, room_availability, bookings, platform_settings, payments,
commissions, owner_payouts, reviews.

Business rules carried forward:
- One owner account can manage multiple properties.
- Registration supports traveller accounts and property-owner registration.
- Admins approve properties.
- Commission percentage is configurable by an administrator.
- Payments and owner payouts are platform-managed.
- Row Level Security stays enabled.

The exact column names should be checked against your existing migration before enabling
the live data adapter. The starter deliberately does not attempt to create or replace
your database tables or RLS policies.

PAYMENTS
--------
No card/mobile-money payment is processed by this static frontend. A secure Supabase
Edge Function or trusted backend must create payment requests, verify provider callbacks,
calculate commissions and release payouts. Do not trust totals or payment status sent
from browser JavaScript.

DEMO MODE
---------
Until Supabase is configured, public pages show sample accommodation cards so you can
review the design. Demo data is not real inventory and cannot be booked.

DESIGN
------
Cream backgrounds, forest-green navigation, muted gold accents, responsive layout,
and separate public, traveller, owner and administrator pages.

