# FYHT4 Admin System

## Admin Role Elevation

The FYHT4 platform includes a secure admin role elevation system that allows authorized users to gain administrative privileges.

### How it Works

1. **Settings Page Access**: Users can access the admin elevation feature from their Settings page
2. **Password Protection**: Admin elevation requires a complex password stored in environment variables
3. **Role Update**: Upon successful validation, the user's role is updated to 'admin' in the database
4. **Dashboard Access**: Admin users gain access to the admin dashboard at `/admin`

### Setup

1. Set the admin password in your environment variables:
   ```env
   ADMIN_ELEVATION_PASSWORD=YourComplexAdminPassword123!@#
   ```

2. Make sure the password is:
   - At least 12 characters long
   - Contains uppercase and lowercase letters
   - Contains numbers and special characters
   - Is not easily guessable

### Admin Features

Once elevated to admin, users can access the admin dashboard at `/admin` with the following capabilities:

#### Project Management (✅ Implemented)
- **View All Projects**: See all projects sorted by zipcode
- **Edit Projects**: Update project fields including:
  - Title, Status, Category
  - Zipcode, City, State  
  - Vote Goal, Funding Goal
- **Delete Projects**: Remove inappropriate or duplicate projects
- **View Statistics**: See vote progress, funding progress, and creator information

#### Proposal Management (✅ Implemented)
- Review and approve/reject project proposals
- Move proposals to active projects

#### System Notifications (✅ Implemented)
- Real-time alerts when projects meet vote and funding goals
- Dashboard notifications for pending admin actions

#### Future Features
- **User Administration**: Manage user accounts and roles
- **System Analytics**: View platform metrics and reports
- **Bulk Operations**: Batch update multiple projects

### Security Notes

- Admin elevation is logged for security auditing
- Only one admin password is supported (stored in environment variables)
- Admin actions are tracked in the system
- The password should be changed regularly and shared only with authorized personnel

### Admin Dashboard

The admin dashboard is located at `/admin` and provides:

#### Main Sections
1. **Admin Stats Overview**
   - Active Projects count
   - Total Users count
   - Pending proposals count
   - System health metrics

2. **Project Management Section** (✅ Main Feature)
   - Table view of all projects sorted by zipcode
   - **Edit Button**: Opens modal to modify:
     - Title, Status, Category
     - Zipcode, City, State
     - Vote Goal, Funding Goal
   - **Delete Button**: Removes projects with confirmation
   - Real-time statistics (vote %, funding %)
   - Creator information display

3. **Admin Notifications**
   - Alerts for projects ready for build phase
   - Pending proposal reviews
   - System notifications

#### How to Use

**Editing a Project:**
1. Navigate to `/admin`
2. Scroll to "Project Management" section
3. Find the project in the table (sorted by zipcode)
4. Click "Edit" button
5. Modify fields in the modal
6. Click "Save Changes"

**Deleting a Project:**
1. Navigate to `/admin`
2. Find the project in the table
3. Click "Delete" button
4. Confirm deletion in the alert dialog

**Security Features:**
- ✅ Rate limiting on all admin operations
- ✅ Input sanitization (XSS prevention)
- ✅ MongoDB injection prevention
- ✅ Audit logging for all admin actions
- ✅ Session timeout (30 minutes)

### Troubleshooting

If admin elevation fails:
1. Verify the `ADMIN_ELEVATION_PASSWORD` environment variable is set
2. Check that the password entered matches exactly (case-sensitive)
3. Ensure the user is properly authenticated
4. Check server logs for any errors

### Future Enhancements

Planned admin features:
- Multiple admin password support
- Role-based permissions (super admin, project admin, etc.)
- User management interface
- Detailed analytics and reporting
- Bulk project management tools