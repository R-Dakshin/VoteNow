# Bulk Voter Operations Guide

## Overview

The VoteHub system now supports bulk operations for managing voters:
- **Bulk Upload** - Upload multiple voters from a CSV file
- **Bulk Delete** - Delete multiple selected voters at once
- **Bulk Reset** - Reset votes for multiple selected voters

## Bulk Upload Voters (CSV)

### How to Use

1. **Prepare your CSV file** with the following format:
   ```csv
   name,email,password
   John Doe,john.doe@example.com,password123
   Jane Smith,jane.smith@example.com,password456
   ```

2. **In the Admin Dashboard:**
   - Go to the **Voters** tab
   - Scroll to the "Bulk Upload Voters (CSV)" section
   - Click "Download Template" to get a sample CSV file
   - Click "Choose CSV File" and select your CSV file
   - The system will automatically process and upload all voters

### CSV Format Requirements

- **Header row (optional):** The first row can contain headers: `name,email,password`
- **Data rows:** Each row should contain three values separated by commas:
  - Column 1: Voter's full name
  - Column 2: Voter's email address
  - Column 3: Voter's password
- **Separators:** Supports both comma (`,`) and tab (`\t`) separated values
- **Quotes:** Values with commas can be enclosed in quotes: `"Doe, John",john@example.com,pass123`

### Example CSV File

```csv
name,email,password
John Doe,john.doe@example.com,password123
Jane Smith,jane.smith@example.com,password456
Bob Johnson,bob.johnson@example.com,password789
```

### Upload Behavior

- **New voters:** If an email doesn't exist, a new voter account is created
- **Existing voters:** If an email already exists, the voter's name and password are updated
- **Validation:** Invalid rows (missing fields, invalid email format) are skipped and reported
- **Results:** After upload, you'll see a summary showing:
  - Number of voters successfully created/updated
  - Number of voters that failed (with reasons)

## Bulk Delete Voters

### How to Use

1. **Select voters:**
   - Go to the **Voters** tab in Admin Dashboard
   - Check the checkbox next to each voter you want to delete
   - Or use "Select All" to select all voters

2. **Delete:**
   - Click the red "Delete" button showing the count of selected voters
   - Confirm the deletion in the popup dialog
   - Selected voters will be permanently deleted

### Important Notes

- ⚠️ **This action cannot be undone!**
- If a deleted voter had voted, their votes will be automatically removed from candidate vote counts
- You can select multiple voters across different pages

## Bulk Reset Voters

### How to Use

1. **Select voters:**
   - Go to the **Voters** tab in Admin Dashboard
   - Check the checkbox next to each voter whose vote you want to reset
   - Or use "Select All" to select all voters

2. **Reset:**
   - Click the "Reset Votes" button showing the count of selected voters
   - Confirm the reset in the popup dialog
   - Selected voters will be able to vote again

### What Happens

- Voter's `hasVoted` status is set to `false`
- Voter's vote history is cleared
- Vote counts for the candidates they voted for are decremented
- Voters can now vote again

## Selection Features

### Select Individual Voters
- Click the checkbox next to any voter card to select/deselect them

### Select All Voters
- Click "Select All" button to select all voters at once

### Deselect All Voters
- Click "Deselect All" button to clear all selections

### Selection Counter
- The interface shows how many voters are currently selected
- Bulk action buttons show the count of selected voters

## API Endpoints

### Bulk Upload
```
POST /api/voters/bulk-upload
Body: { voters: [{ name, email, password }, ...] }
```

### Bulk Delete
```
DELETE /api/voters/bulk-delete
Body: { voterIds: [id1, id2, ...] }
```

### Bulk Reset
```
PUT /api/voters/bulk-reset
Body: { voterIds: [id1, id2, ...] }
```

## Tips & Best Practices

### CSV Upload Tips
1. **Always validate your CSV** before uploading:
   - Check that all rows have 3 columns
   - Verify email addresses are valid
   - Ensure passwords are not empty

2. **Use unique emails:** Each voter must have a unique email address

3. **Password security:** Use strong passwords for voter accounts

4. **Test with small files first:** Upload a few test voters before bulk uploading hundreds

### Bulk Operations Tips
1. **Review selections:** Always double-check which voters are selected before performing bulk actions

2. **Backup important data:** Consider exporting voter lists before bulk deletions

3. **Use filters:** If available, filter voters before selecting to target specific groups

4. **Monitor results:** Check the success/error messages after bulk operations

## Troubleshooting

### CSV Upload Issues

**Problem:** "No valid voters found in CSV"
- **Solution:** Check that your CSV has the correct format (name,email,password)
- Ensure there are no empty rows or missing columns

**Problem:** "Invalid email format" errors
- **Solution:** Verify all email addresses are properly formatted (e.g., user@example.com)

**Problem:** Some voters failed to upload
- **Solution:** Check the error message for specific reasons. Common issues:
  - Duplicate emails (already exists)
  - Missing required fields
  - Invalid email format

### Bulk Delete/Reset Issues

**Problem:** Action not working
- **Solution:** Ensure at least one voter is selected
- Check that you're logged in as an admin
- Verify the API connection is working

**Problem:** Votes not resetting properly
- **Solution:** The system automatically handles vote count adjustments. If issues persist, check the candidate vote counts manually.

## CSV Template

A template file (`voters_template.csv`) is included in the project root. You can also download it from the admin interface by clicking "Download Template" in the Bulk Upload section.

## Security Notes

- ⚠️ Bulk operations are only available to admin users
- CSV files are processed server-side for security
- Passwords in CSV files are hashed before storage
- Always use secure passwords for voter accounts
