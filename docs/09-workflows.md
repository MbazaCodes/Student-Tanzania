# Common Workflows

End-to-end flows through the system.

## 1. National admin onboards a region
1. Log in as National (`support@tsid.go.tz`) → `/gov`
2. **Administrators** → Create admin → Regional Admin → pick region → set email + temp password
3. Edge `create-admin` creates the auth account + admin_users row
4. Share credentials with the Regional admin
5. Regional admin logs in → portal scoped to their region

## 2. Regional admin onboards a district
1. Log in as Regional → **Administrators**
2. Create admin → (locked to District in own region) → pick district
3. Share credentials → District admin logs in (scoped to district)

## 3. Registering a school
1. Any gov admin → **Schools** → Register school
2. Select type (Pre-School…Special Needs), name
3. Region → District → Ward cascade (scoped for regional/district admins)
4. School code auto-generates with region prefix
5. Enter **Login Email** + temp password
6. Edge `create-school` creates the school auth account + rows
7. Share credentials → school admin logs in → `/school`

## 4. School registers a student
1. School admin → **Students** → Create student
2. TSID auto-generates (`TSID-YYYY-XXXXXXX`)
3. Fill student details — **Current Level dropdown adapts to the school type**
4. Nationality, Gender, Blood Group, Relationship are dropdowns
5. School/location fields auto-fill from the school record
6. Submit → student row created → credentials shown
7. Student can log in (when student auth accounts are enabled) → `/student`

## 5. Resetting a school password
1. Any gov admin (scoped) → **Schools** → key icon on the school row
2. Generate/enter new password → Reset
3. Edge `manage-admin` (`reset_school_password`) updates the auth user
4. Share the new password with the school

## 6. Managing admins (National only)
- **Edit** (pencil): name, region, district, status, notes
- **Reset password** (key): new password via `manage-admin`
- **Delete** (trash): removes login + access (not self, not National targets)

## 7. Public ID verification
1. Anyone → landing page → **Verify a student ID** (`/search`)
2. Enter TSID → see verification result (no login needed)
