# Admin roles and backend authorization

The backend uses `ADMIN` and `SYSTEM_ADMIN` (shown in the interface as Super
Admin). The frontend reads the role returned by the existing admin login and
uses it for navigation and route checks. The backend independently enforces
permissions on protected operations.

## Connected backend capabilities

- Vendor directory and application review use `/businesses/admin/` with
  `status=approved` or `status=all`, plus the existing decision and history
  endpoints. ADMIN and SYSTEM_ADMIN are authorized.
- Pet moderation uses `/pets/admin/pending/` and the approve, reject, and
  deactivate endpoints. Both administrator roles are authorized.
- Merchandise management uses `/products/` and `/products/{id}/` for listing,
  creation, updates, and deactivation. The backend permits both administrator
  roles to manage products across businesses.
- Adoption review uses `/adoptions/applications/vendor/` to list across vendors
  and `/adoptions/applications/{application_id}/decision/` to approve or reject.
  Both administrator roles are authorized.
- Personal notifications use `/notification/`, `/notification/unread-count/`,
  `/notification/{id}/read/`, and `/notification/mark-all-read/`. The backend
  returns only notifications belonging to the signed-in account.
- The read-only admin profile uses `/auth/current-user/`.
- Categories and administrator account management were already connected and
  continue using their existing endpoints.

## Administrator account API

`src/services/adminManagementApi.ts` calls `/admin/administrators/` for listing,
creating, viewing, and updating accounts, plus `/activate/` and `/deactivate/`
actions. The UI supports listing, creating ADMIN accounts, editing contact/name
details, and activation status. The API assigns ADMIN during creation.

The API does not support changing an administrator's role. Role assignment is
server-controlled, and any role sent in a request body is ignored.

## Backend work still required

- Provide an administrative role and permission management API before enabling
  Roles & Permissions. The existing administrator API does not assign roles.
- The backend records audit events, but exposes no endpoint to read them.
- Provide platform settings and configuration endpoints before enabling those
  sections.
- Add administrator endpoints for a customer directory, service listings,
  bookings, orders, payments, reviews, support, and reports. Services currently
  belong to individual vendors and their endpoints do not authorize Admin
  accounts.
- The admin profile endpoint is read-only. Add an admin profile update endpoint
  to enable profile editing.

Adoption applications, notifications, the admin profile, approved vendors, and
pending pet moderation are now connected to their real backend routes. The
frontend repository's `swagger.json` contains a Not Found response, so endpoint
details were verified from the backend URL, view, serializer, permission, and
API documentation files.
