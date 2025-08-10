# Adding New Datasets - Standard Operating Procedure

This guide explains how to add new clinical case datasets to the DXSim platform. The system is designed to automatically detect and display new datasets once they're properly configured in the database.

## Overview

The platform uses two main database tables:
- `datasets` - Contains dataset metadata and configuration
- `cases` - Contains individual clinical cases linked to datasets

## Step 1: Add Dataset to Database

### 1.1 Insert Dataset Record

Add a new record to the `datasets` table with the following structure:

```sql
INSERT INTO datasets (
    id,
    name,
    full_name,
    description,
    website_url,
    total_cases,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'dataset_short_name',           -- Use lowercase, no spaces (e.g., 'nejm', 'bmj', 'lancet')
    'Dataset Full Display Name',     -- Human-readable name (e.g., 'British Medical Journal')
    'Brief description of the dataset and its clinical cases',
    'https://website-url.com',
    0,                              -- Will be updated as cases are added
    now(),
    now()
);
```

### 1.2 Required Field Guidelines

- **`name`**: Short identifier, lowercase, no spaces or special characters
- **`full_name`**: Display name shown in the UI
- **`description`**: Brief, informative description for users
- **`website_url`**: Official source website
- **`total_cases`**: Start with 0, update as cases are added

## Step 2: Add Cases to Database

### 2.1 Case Data Structure

Each case should follow this structure in the `cases` table:

```sql
INSERT INTO cases (
    id,
    doi,
    title,
    year,
    date_added,
    clinical_vignette,
    dataset,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '10.1234/example.doi',          -- DOI or unique identifier
    'Case Title: Patient Description',
    2024,                           -- Publication year
    '2024-01-15',                   -- When case was published
    'Brief clinical vignette text...',
    'dataset_short_name',           -- Must match dataset.name exactly
    now(),
    now()
);
```

### 2.2 Data Quality Requirements

- **`dataset`**: Must exactly match the `name` field from the datasets table
- **`year`**: Used for chronological grouping in the UI
- **`date_added`**: Used for sorting within years (most recent first)
- **`title`**: Should be descriptive and follow consistent formatting
- **`clinical_vignette`**: Brief summary of the case for search/preview

### 2.3 Bulk Data Import

For large datasets, use CSV import or batch SQL operations. Ensure:
- All field names use dashes instead of underscores (e.g., `clinical-vignette`)
- Missing values are set to `null`
- Data validation is performed before import

## Step 3: Update Dataset Case Count

After adding cases, update the total count:

```sql
UPDATE datasets 
SET 
    total_cases = (SELECT COUNT(*) FROM cases WHERE dataset = 'dataset_short_name'),
    updated_at = now()
WHERE name = 'dataset_short_name';
```

## Step 4: UI Customization (Optional)

### 4.1 Add Dataset Icon

1. Place icon file in `public/images/` (SVG preferred)
2. Update `getDatasetIcon()` function in `/src/app/library/page.tsx`:

```typescript
const getDatasetIcon = (name: string) => {
  switch (name) {
    case 'nejm':
      return <Image src="/images/nejm-logo.svg" alt="NEJM Logo" width={32} height={32} />;
    case 'your_new_dataset':
      return <Image src="/images/your-logo.svg" alt="Your Logo" width={32} height={32} />;
    default:
      return <FileQuestionMark className="h-8 w-8" />;
  }
};
```

### 4.2 Add Custom Styling

Update `getDatasetColor()` function for custom card colors:

```typescript
const getDatasetColor = (name: string) => {
  switch (name) {
    case 'nejm':
      return 'bg-blue-500/20';
    case 'your_new_dataset':
      return 'bg-green-500/20';  // Choose appropriate color
    default:
      return 'bg-gray-500/20';
  }
};
```

### 4.3 Add Year Range (Optional)

Update `getYearRange()` function if you want custom year ranges:

```typescript
const getYearRange = (name: string) => {
  switch (name) {
    case 'nejm':
      return '2005-2025';
    case 'your_new_dataset':
      return '2010-2024';  // Actual range from your data
    default:
      return 'Various';
  }
};
```

## Step 5: Testing

### 5.1 Verify Database Integration

1. Check that the dataset appears on `/library`
2. Verify the dataset page loads at `/library/your_dataset_name`
3. Confirm cases are grouped by year and sorted correctly
4. Test the dataset picker functionality

### 5.2 UI Testing

1. Verify custom icons display correctly
2. Check responsive design on different screen sizes
3. Test loading states and error handling
4. Confirm breadcrumb navigation works

## Step 6: Data Quality Checks

### 6.1 Required Validations

- All cases have valid `dataset` references
- No duplicate DOIs within the same dataset
- All years are valid (numeric, reasonable range)
- Clinical vignettes are present and meaningful
- Case titles follow consistent formatting

### 6.2 Performance Considerations

- For datasets with >1000 cases, consider implementing pagination
- Monitor API response times for large datasets
- Consider adding database indexes on frequently queried fields

## Troubleshooting

### Common Issues

1. **Dataset not appearing**: Check that `name` field matches exactly between tables
2. **Cases not loading**: Verify `dataset` field in cases matches dataset `name`
3. **Incorrect sorting**: Ensure `date_added` and `year` fields are properly formatted
4. **UI styling issues**: Check that custom icon/color functions return valid values

### Support

For technical issues or questions about this process, refer to:
- Database schema documentation
- API route implementations in `/src/app/api/`
- Component code in `/src/app/library/`

---

*Last updated: January 2025*
*Version: 1.0*
