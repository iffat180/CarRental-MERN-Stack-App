# Phase 2.0 – Owner Onboarding & “List Your Car” UX

## Goal

Make the “List your car” flow realistic and professional:

- Only **authenticated users** can become owners / list cars.
- Non-logged users get a clear **“Login / Create account to become an owner”** experience.
- Logged-in normal users can **upgrade to owner** via an explicit step.
- Users with role=`owner` go straight into the **owner portal** (e.g. AddCar / Dashboard).
- The flow feels like a proper host/owner onboarding, not a random 401.

---

## Desired Behaviour (UX / Rules)

### A. Navbar “List your car” button

1. **User not logged in**
   - Clicking “List your car” should:
     - Store `redirectPath` = **owner entry point** (e.g. `/owner/add-car` or `/owner/dashboard`).
     - Open the existing **Login modal** with text like:
       - “Create an account to list your car”
     - After successful signup/login, user is redirected to `redirectPath`.

2. **User logged in, role != "owner" (normal renter)**
   - Clicking “List your car” should:
     - Open a new **OwnerOnboardingModal**:
       - Title: “Become a car owner”
       - Short explanation of owner portal
       - Buttons:
         - “Become an owner” → calls backend to upgrade role, then redirects to owner portal.
         - “Cancel” → close modal.
     - Once backend confirms upgrade:
       - `role` becomes `"owner"` in frontend state.
       - Navigate to `/owner/add-car` (or `/owner/dashboard`).
       - Optional toast: “You’re now registered as an owner.”

3. **User logged in, role === "owner"**
   - Clicking “List your car” should **immediately navigate** to `/owner/add-car`  
     (or the main owner dashboard).

---

## Backend Changes

### 1. Add “upgrade to owner” endpoint

File: `server/controllers/userController.js`

- New function: `upgradeToOwner`
  - Requires auth (`protect`).
  - If user already `role === "owner"` → return success (no-op).
  - Otherwise:
    - Set `user.role = "owner"`.
    - Save user.
    - Return `{ success: true, message: "You are now an owner", user: { ...updatedUserWithoutPassword } }`.

File: `server/routes/userRoutes.js`

- New protected route:
  - `POST /api/user/upgrade-to-owner`
  - Middlewares: `userLimiter`, `protect`, maybe a simple validator or none.
  - Handler: `upgradeToOwner`.

---

## Frontend Changes

### 2. Navbar “List your car” behaviour

File: `client/src/components/Navbar.jsx` (or wherever the button lives)

- Use `useAppContext()` to get `user`, `navigate`, and the login modal toggles.
- Replace direct navigation / 401 behaviour with:

Pseudo:

```js
const handleListYourCarClick = () => {
  if (!user) {
    // Not logged in: store redirectPath and open login modal in "register" or "login" mode
    const path = "/owner/add-car"; // or "/owner/dashboard"
    sessionStorage.setItem("redirectPath", path);
    setShowLogin(true);
    setState("register"); // or decide between login/register
    return;
  }

  if (user.role === "owner") {
    navigate("/owner/add-car");
    return;
  }

  // Logged in, not owner: open OwnerOnboardingModal
  setShowOwnerOnboarding(true);
};

3. New OwnerOnboardingModal component

File: client/src/components/owner/OwnerOnboardingModal.jsx (new)

Props:

isOpen

onClose

onBecomeOwner (calls backend)

UI:

Title: “Become a car owner”

Text: brief explanation (1–2 lines)

Buttons:

“Cancel” – closes modal

“Become an owner” – calls onBecomeOwner, shows loading state

4. Integrate OwnerOnboardingModal into Navbar (or a top-level layout)

Local state in Navbar (or a top wrapper) for:

showOwnerOnboarding

isUpgradingOwner (loading)

When user clicks “Become an owner”:

POST /api/user/upgrade-to-owner via axios.

On success:

Update user in context (role = "owner").

Close modal.

Navigate to /owner/add-car.

Show toast success.

On error:

Show toast error.

Keep modal open (allow retry).

5. Login redirect (already partly implemented)

Re-use existing redirectPath logic in Login.jsx:

After successful login/signup:

Call redirectBack(navigate) as already implemented.

This should now correctly handle “List your car” -> login -> /owner/add-car.