# Radar Improvements Implementation Plan

## Goal
Implement interactive Radar hotspots where users can click on a location to view active users. The system must filter out "ghosted" users and distinguish between "fresh targets" (users not yet reacted to) and "depleted" locations (users already reacted to).

## Requirements
1.  **Clickable Hotspots:** Clicking a place on the Radar opens a list of users at that location.
2.  **Ghost Filtering:** Users who have ghosted the current user (or vice versa) must NOT appear in the count or the list.
3.  **Target Aggregation:**
    - Calculate `target_count`: Number of users in the location that the current user has NOT reacted to (no like, no dismiss, no match).
    - Calculate `total_count`: Total active users in the location (excluding ghosts).
4.  **Visual Feedback:**
    - If `target_count > 0`: Show as active hotspot (standard red/pulsing).
    - If `target_count == 0` but `total_count > 0`: Show as "depleted" (greyed out, target icon, "Vystříleno").
5.  **User List Details:**
    - Show user's reaction status (Liked, Passed, Matched, or None/Target).
    - "Target" users should be highlighted.

## Architecture & Changes

### 1. Database (`db/migrations/15_radar_improvements.sql`)

We need to create a new migration that updates `get_active_hotspots` and adds `get_hotspot_users`.

#### `get_active_hotspots` Update
- **Input:** `radius_km`, `current_lat`, `current_long`
- **Output:** `id`, `name`, `distance`, `count` (total), `target_count` (fresh), `label`, `latitude`, `longitude`
- **Logic:**
    - Filter out `blocked_users` (ghosts).
    - Count `active_users`.
    - Count `active_users` where `id` is NOT IN `likes` OR `dismisses` OR `matches` (relative to current user).

#### `get_hotspot_users` New RPC
- **Input:** `place_id`
- **Output:** List of users with:
    - Basic profile info (id, username, avatar_url, age, etc.)
    - `status`: 'target', 'liked', 'dismissed', 'matched'
- **Logic:**
    - Fetch users within 500m of the place.
    - Exclude ghosts.
    - Determine status based on `likes`, `dismisses`, `matches` tables.

### 2. Frontend Services (`services/userService.ts`)

- Update `Hotspot` interface in `types.ts` to include `targetCount`.
- Update `fetchActiveHotspots` to handle the new response structure.
- Add `fetchHotspotUsers(placeId: string): Promise<HotspotUser[]>` function.

### 3. UI Components

#### `types.ts`
- Add `HotspotUser` interface.
- Update `Hotspot` interface.

#### `components/DiscoveryView.tsx`
- **State:** Add `selectedHotspot` state (Hotspot | null).
- **Render:**
    - Update hotspot list rendering:
        - Add `onClick` handler.
        - Check `targetCount`. If 0, apply "depleted" styling (grey, target icon).
    - Add `HotspotUsersModal` (or inline overlay) when `selectedHotspot` is set.

#### `components/HotspotUsersModal.tsx` (New Component)
- **Props:** `hotspot`, `onClose`, `onUserClick` (optional).
- **Behavior:**
    - Fetch users using `fetchHotspotUsers` on mount.
    - Render list of users.
    - Show status badges (e.g., "Target" 🎯, "Liked" ❤️, "Passed" ❌).

## Step-by-Step Implementation Guide

### Step 1: Database Migration
- Create `db/migrations/15_radar_improvements.sql`.
- Define `get_active_hotspots` with new logic.
- Define `get_hotspot_users`.
- **Action:** Run the migration (or instruct user to run it if manual).

### Step 2: Types & Service
- Update `types.ts` with new interfaces.
- Update `services/userService.ts` to use the new RPCs.

### Step 3: UI Implementation
- Create `components/HotspotUsersModal.tsx`.
- Modify `components/DiscoveryView.tsx` to integrate the modal and update hotspot styling.

### Step 4: Verification
- Verify that ghosted users don't show up.
- Verify that "depleted" places look different.
- Verify that clicking a place shows the correct user list with correct statuses.
