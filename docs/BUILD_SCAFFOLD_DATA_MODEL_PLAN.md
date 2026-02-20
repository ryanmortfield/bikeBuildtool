# Build scaffold: data model plan

## Target experience

1. **Categories** (e.g. Drivetrain, Braking, Frameset) are containers. The user can move things between categories easily.
2. **Components** are selectable: each row/slot in the build is a component (Crankset, Chainrings, etc.). The user can add or remove component slots and choose which component type each slot is.
3. **Multiselect → groups**: the user can select multiple components (e.g. Crank arms + Chainrings + Spider) and group them (e.g. “Crankset”). Groups behave as one unit and can be moved between categories together.
4. **Parts** are assigned to a component slot (or to a group’s “slot”); moving a group moves its parts with it.

So the flow is: **Categories** contain **Slots**. A slot can be a single **Component** or a **Group** (named set of components). Each slot has **Part(s)** assigned. Slots and groups can be **moved between categories**.

---

## Current model (limitations)

| Concept | Current | Limitation |
|--------|---------|------------|
| Categories | Fixed in code (`ComponentDef.group`: Frameset, Drivetrain, …). | Not movable; can’t add/rename/reorder categories per build. |
| Components | Fixed list of component keys; UI is driven by `COMPONENTS` array. | No “add a new component slot” without it being one of the fixed types; combo “rows” are show/hide of that fixed list. |
| Groups | Only “combo” card: one fixed group (crankset) with fixed sub-components. | No user-defined groups; no multiselect to form a group; groups can’t move. |
| Build layout | Implicit: we derive layout from component keys + `group` + `compositeGroup`. | Layout is not first-class; can’t “move Crankset to Braking” or “add a new category”. |

**Data today**

- `builds`: id, name, bikeType, userId, timestamps.
- `parts`: catalog; each part has a `component` key.
- `build_parts`: build_id, **component** (single key), part_id/customName, quantity, component_label, etc.  
  So “which category this row lives in” and “is this row part of a group?” are **not stored**; they come from the fixed taxonomy.

---

## Proposed model (direction)

We need the **build’s layout** to be first-class: categories, slots, and optional groups, all movable.

### Option A: Build-scoped layout (recommended)

**New / changed concepts**

1. **Build categories (build_categories)**  
   - Per build: ordered list of categories.  
   - Fields: `build_id`, `id` (e.g. uuid), `name` (e.g. "Drivetrain"), `sort_order`.  
   - User can add/remove/rename/reorder categories for that build.

2. **Build slots (build_slots)**  
   - One row in the scaffold = one slot.  
   - Fields: `build_id`, `id`, **category_id** (FK to build_categories), `component_key` (which component type: crankset, chainrings, …), `sort_order`, optional **group_id** (nullable; if set, this slot belongs to a group).  
   - Moving a slot = update its `category_id`.  
   - “Add a new part category” = add a new slot with the chosen `component_key` and `category_id`.

3. **Build groups (build_groups)**  
   - Named group that can contain multiple slots.  
   - Fields: `build_id`, `id`, `name` (e.g. "Crankset"), optional `category_id` (group’s “home” category for display), `sort_order`.  
   - Slots that belong to the group have `group_id` set.  
   - Moving the group = update `category_id` on the group (and optionally all its slots’ category_id for consistency).

4. **Build parts (build_parts)**  
   - Stay, but reference **slot** instead of (implicitly) component + position.  
   - Fields: add **build_slot_id** (FK to build_slots). So “this part is on this slot”.  
   - Keep `component` for compatibility / reporting if desired, but assignment is slot-based.  
   - One slot can still have multiple parts (e.g. multiple chainrings) → multiple build_parts with same build_slot_id.

**Flow**

- Build opens → load build_categories (order) and build_slots (per category, with group_id if any).  
- UI: categories as sections; each section has slots (single component or grouped). User can:  
  - Add/remove/reorder categories.  
  - Add a slot (pick component type, pick category).  
  - Remove a slot.  
  - Multiselect slots → “Group these” → create build_group, set group_id on those slots.  
  - Move slot or group to another category (update category_id).  
- Part picker assigns part to a **slot**; backend stores build_part.build_slot_id.

### Option B: Minimal change (slots only)

- Add **build_slots**: build_id, id, category (string or FK), component_key, sort_order. No groups.  
- build_parts gets **build_slot_id**; component can be derived from slot.  
- Categories could stay fixed in code, or become a simple build_categories table.  
- No “group” entity; no multiselect/grouping.  
- Easiest step toward “add a new part category [slot] right away” and “move between categories”.

### Option C: Groups only (no per-build categories)

- Keep categories fixed.  
- Add build_groups and allow slots (or “component rows”) to be grouped; groups are movable between fixed categories.  
- Less flexible than A.

---

## Recommendation

- **Short term:** Option B (build_slots + build_parts.slot_id) gets you:  
  - Add any component slot to any category.  
  - Move slots between categories.  
  - Clear “one row = one slot” model.

- **Next step:** Add build_categories (Option A) so categories are per build and reorderable.

- **Then:** Add build_groups and multiselect-to-group (Option A) so users can group components and move groups between categories.

---

## Migration sketch (Option B → A path)

1. Add `build_categories` and `build_slots` (and optionally `build_groups` later).  
2. Backfill from current build_parts: for each build, create default categories (from current COMPONENTS group list), create one slot per (build_id, component) that has parts, assign build_part → slot (add build_slot_id to build_parts, backfill, then make it required and drop inferring layout from component only).  
3. API: CRUD for build_categories, build_slots, build_groups; build_parts create/update uses build_slot_id.  
4. UI: scaffold driven by build_slots (and build_groups) instead of COMPONENTS + partsByComponent.

---

## Open decisions

1. **Default layout for new builds** – Create default build_categories + build_slots from current COMPONENTS taxonomy so existing UX is preserved until the user customizes?  
2. **Parts catalog** – Keep `parts.component` as “suggested for these component types” or also drive compatibility by slot’s component_key.  
3. **Group display** – Collapsible “group” card (like current combo) with slots inside, or inline with a visual tie (e.g. indent + label).

Once you’re happy with this direction (and whether to start with B or go straight to A), we can break it into concrete schema changes, API endpoints, and UI steps.
