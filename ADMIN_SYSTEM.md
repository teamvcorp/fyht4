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

Once elevated to admin, users can:

- **Project Management**: View and update project statuses through the admin dashboard
- **Build Phase Management**: Move projects from voting/funding to building phase
- **Completion Tracking**: Mark projects as completed when construction is finished
- **Real-time Notifications**: Receive alerts when projects meet their vote and funding goals
- **User Administration**: Manage user accounts and roles (future feature)
- **System Analytics**: View platform metrics and reports (future feature)

### Security Notes

- Admin elevation is logged for security auditing
- Only one admin password is supported (stored in environment variables)
- Admin actions are tracked in the system
- The password should be changed regularly and shared only with authorized personnel

### Admin Dashboard

The admin dashboard (`/admin`) provides:
- Project status overview
- Pending actions notifications
- Quick management tools
- System status monitoring

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