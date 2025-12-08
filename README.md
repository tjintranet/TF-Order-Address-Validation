# TFUK Address Validator with Geoapify

A web-based application for validating addresses from Taylor & Francis UK (TFUK) EDI order files using the Geoapify Geocoding API. This tool automatically extracts addresses from H2 records, validates required fields, geocodes addresses, and provides detailed validation reports.

## Features

### Core Functionality
- **TFUK EDI File Parsing**: Automatically extracts address data from H2 records in TFUK EDI .txt files
- **Required Field Validation**: Ensures all addresses have Postcode, Country Code, Email, and Phone Number
- **Amazon Order Exception**: Automatically skips email validation for Amazon orders (warehouse deliveries)
- **Geoapify Integration**: Validates addresses using Geoapify's Geocoding API with automatic retry logic
- **Geocoding Results**: Returns standardized addresses with latitude/longitude coordinates
- **Error Handling**: Robust handling of API errors with automatic fallback to simplified searches

### User Interface
- **Clean Professional Design**: Bootstrap-based interface matching TFUK Order Parser aesthetic
- **Progress Tracking**: Real-time progress bar during validation
- **Statistics Dashboard**: Overview showing total, valid, and invalid addresses
- **Color-Coded Results**: Green cards for valid addresses, red for invalid
- **Filter Controls**: Toggle to show only invalid addresses
- **Interactive Cards**: Expandable address cards with detailed information
- **Google Maps Integration**: Click coordinates to view locations on Google Maps

### Export & Copy Features
- **CSV Export**: Download complete validation results with all fields
- **Copy Individual Results**: Copy single address details to clipboard
- **Copy Invalid Report**: Bulk copy all invalid addresses for reporting
- **Formatted Output**: Clean, readable text format for easy sharing

### Technical Features
- **Secure API Key Storage**: Keys stored locally in browser (localStorage)
- **Rate Limit Compliance**: Built-in delays to respect API rate limits
- **Data Sanitization**: Removes special characters that could cause API errors
- **Retry Logic**: Automatic retry with simplified search on API failures
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Prerequisites

### Geoapify API Key
You need a Geoapify API key to use this application:

1. **Sign up** at [geoapify.com](https://www.geoapify.com/)
2. **Select API Type**: Choose **Geocoding API** (or "Geocoding & Search")
3. **Choose Plan**: 
   - **Free Tier**: 3,000 requests per day (recommended to start)
   - **Paid Plans**: Available for higher volumes

### Browser Requirements
- **Modern Browser**: Chrome, Safari, Firefox, or Edge (latest versions)
- **JavaScript Enabled**: Required for all functionality
- **Internet Connection**: Required for API calls

## Installation

### Quick Start
1. Download the application files:
   - `index.html`
   - `script.js`

2. Place both files in the same directory

3. Open `index.html` in your web browser

4. **No server required** - runs entirely in your browser

### Deployment Options
- **Local Use**: Open `index.html` directly from your file system
- **Web Server**: Host on any static web server (Apache, Nginx, etc.)
- **Intranet**: Deploy on internal servers for team use
- **Cloud Storage**: Host on services like AWS S3, GitHub Pages, etc.

## Usage Guide

### Step 1: Configure API Key

1. **Open the Application**
   - Launch `index.html` in your browser

2. **Enter API Key**
   - Paste your Geoapify API key into the input field
   - Click the eye icon to show/hide the key
   - Click **"Save Key"**

3. **Key Storage**
   - API key is saved in browser's localStorage
   - Persists between sessions
   - Never transmitted to any server except Geoapify
   - Click **"Change Key"** to update if needed

### Step 2: Upload TFUK File

1. **Select File**
   - Click **"Choose File"** button
   - Select a TFUK EDI .txt file (example: `T1_M01281609.txt`)
   - File must be in TFUK EDI format with H2 records

2. **Automatic Processing**
   - File is parsed immediately upon selection
   - H2 records are extracted automatically
   - Validation begins automatically

3. **Monitor Progress**
   - Progress bar shows validation status
   - Counter displays current/total addresses
   - Approximately 350ms per address (~170 addresses/minute)

### Step 3: Review Results

#### Statistics Dashboard
View at-a-glance summary:
- **Total Addresses**: Number of H2 records processed
- **Valid Addresses**: Addresses with all required fields and found by Geoapify
- **Invalid Addresses**: Addresses missing required fields or not found

#### Address Cards
Each address displays in a color-coded card:

**Valid Address (Green):**
- ✅ Has all required fields (Postcode, Country, Email*, Phone)
- ✅ Successfully validated by Geoapify
- Shows formatted address and coordinates
- Displays confidence score

**Invalid Address (Red):**
- ❌ Missing one or more required fields, OR
- ❌ Address not found by Geoapify
- Shows specific error messages
- No coordinates available

*Email not required for Amazon orders

#### Detailed Information
Each card shows:
- **Order Number** and **Line Number** from TFUK file
- **Customer Code** and **Customer Name**
- **Input Address**: As extracted from TFUK file
  - Address Lines 1, 2, 3
  - City, Postcode, Country
  - Email and Phone
- **Validated Address**: Formatted address from Geoapify
- **Coordinates**: Latitude/Longitude with Google Maps link
- **Confidence Score**: Geoapify's confidence rating (0-100%)
- **Errors**: Specific validation errors if any

### Step 4: Filter and Export

#### Filter Controls

**Show only invalid addresses** toggle:
- Check: Hides valid addresses, shows only invalid
- Uncheck: Shows all addresses
- Automatically resets when uploading new file

#### Export Options

**Copy Invalid Addresses:**
- Generates formatted text report of all invalid addresses
- Includes order numbers, errors, and address details
- Perfect for emailing to customers or colleagues

**Export Results CSV:**
- Downloads comprehensive CSV file
- Includes all fields: Order, Line, Customer, Addresses, Status, Errors
- Filename format: `tfuk-address-validation-YYYY-MM-DD.csv`
- Can be opened in Excel, Google Sheets, etc.

**Copy Individual Address:**
- Click "Copy Details" on any address card
- Formatted text copied to clipboard
- Includes all input and validated information

## TFUK File Format

### Expected File Structure

The application parses TFUK EDI files with these record types:

```
$$HDRTFUK  0019524   20250128160930
H17000681599     20250128...
H27000681599     ST0070000049               Gardners Books Ltd...
D17000681599     7844445-21...
$$EOFTFUK  0019524   202501281609300000535
```

### H2 Record Layout (Address Data)

The application extracts data from H2 records using fixed-width positions:

| Field | Position | Description | Example |
|-------|----------|-------------|---------|
| Record Type | 1-2 | Always "H2" | H2 |
| Order Number | 3-17 | From parent H1 record | 7000681599 |
| Customer Code | 18-35 | Account code | ST0070000049 |
| Customer Name | 36-85 | Company/person name | Gardners Books Ltd |
| Address Line 1 | 86-135 | Street address | 1 Whittle Drive |
| Address Line 2 | 136-185 | Additional address | (often empty) |
| Address Line 3 | 186-235 | Additional address | (often empty) |
| Email | 236-285 | Email address | paul.taylor@gardners.com |
| City | 286-320 | City/town | Eastbourne |
| Postcode | 321-340 | Postal code | BN23 6QH |
| Country | 331-333 | 3-letter code | GBR |
| Phone | 340-359 | Phone number | 01323 521555 |

**Note**: Positions 320-359 contain overlapping data (postcode, country, phone) which the parser intelligently separates.

## Validation Rules

### Required Fields

All addresses MUST have:
1. ✅ **Postcode**
2. ✅ **Country Code** (3-letter format: GBR, USA, etc.)
3. ✅ **Email** (except for Amazon orders)
4. ✅ **Phone Number**

Missing any required field = **INVALID**

### Amazon Order Exception

Orders are automatically identified as Amazon orders if the customer name contains "amazon" (case-insensitive):

**Amazon Order Examples:**
- "Amazon UK"
- "Amazon.com" 
- "AMAZON LOGISTICS"
- "Amazon Services Ltd"

**Email validation is skipped** for these orders because they are warehouse deliveries with no end-customer email.

### Geoapify Validation

For addresses with all required fields, the application:

1. **Builds Search Query**: Concatenates address components
2. **Sanitizes Data**: Removes special characters that could cause errors
3. **Calls Geoapify API**: Geocodes the address
4. **Handles Errors**:
   - **500 Errors**: Retries with simplified search (postcode + country only)
   - **404 Not Found**: Marks as invalid
   - **401 Unauthorized**: Invalid API key
   - **429 Rate Limit**: Rate limit exceeded
5. **Returns Result**:
   - **Valid**: Address found by Geoapify
   - **Invalid**: Address not found

**Important**: All Geoapify confidence scores and warnings are ignored. If the address is found, it's marked valid.

## Validation Statuses

### ✅ Valid (Green)
- Has all required fields (or is Amazon order without email)
- Successfully validated by Geoapify
- Shows formatted address and coordinates

### ❌ Invalid (Red)
**Reasons for Invalid Status:**
1. Missing required fields (Postcode, Country, Email*, Phone)
2. Address not found by Geoapify
3. API errors (500, network issues, etc.)

*Email not required for Amazon orders

## Rate Limits & Performance

### Geoapify Free Tier
- **Daily Limit**: 3,000 requests per day
- **Reset**: Daily at midnight UTC
- **Cost**: Free (no credit card required)

### Application Rate Limiting
- **Delay Between Requests**: 350ms (~170 addresses/minute)
- **Built-in Protection**: Prevents exceeding rate limits
- **Automatic Retry**: 500ms delay on failures

### Processing Time Examples
| Addresses | Estimated Time |
|-----------|----------------|
| 10 | ~4 seconds |
| 50 | ~18 seconds |
| 100 | ~35 seconds |
| 500 | ~3 minutes |
| 1,000 | ~6 minutes |

### Large File Recommendations
For files with 1,000+ addresses:
- Process during off-peak hours
- Consider splitting into multiple smaller files
- Monitor API usage in Geoapify dashboard
- Upgrade to paid plan if needed regularly

## CSV Export Format

The exported CSV includes these columns:

| Column | Description |
|--------|-------------|
| Order | Order number from H1 record |
| Line | Line number in TFUK file |
| Customer Code | Account code from H2 record |
| Name | Customer name |
| Address1 | Street address line 1 |
| Address2 | Street address line 2 |
| Address3 | Street address line 3 |
| City | City/town |
| Postcode | Postal/ZIP code |
| Country | Country code (GBR, USA, etc.) |
| Email | Email address |
| Phone | Phone number |
| Status | "success" or "error" |
| Confidence | Geoapify confidence (0-100%) |
| Formatted Address | Standardized address from Geoapify |
| Latitude | Latitude coordinate |
| Longitude | Longitude coordinate |
| Errors | Error messages (semicolon-separated) |

## Error Messages

### Common Errors

**Missing required fields: [fields]**
- One or more required fields are empty in the TFUK file
- Action: Contact customer or check TFUK data source

**Address not found by Geoapify**
- Geoapify could not locate the address
- Action: Verify address is correct, may need manual review

**API Error: 500 - Server error, address may contain invalid characters**
- Address data contains characters causing API issues
- Application automatically retries with simplified search
- Action: If persists, address may need manual verification

**Invalid API key**
- API key is incorrect or expired
- Action: Check API key in Geoapify dashboard, update in application

**Rate limit exceeded**
- Daily API limit (3,000) reached
- Action: Wait until midnight UTC or upgrade plan

**Address not found by Geoapify (simplified search)**
- Full address search failed, simplified search (postcode + country) also failed
- Action: Address may be invalid or incorrectly formatted

## Troubleshooting

### File Not Loading
**Problem**: TFUK file doesn't upload or parse
**Solutions**:
- Ensure file is .txt format
- Verify file contains H2 records
- Check file isn't corrupted
- Try opening file in text editor first
- Ensure file size is reasonable (<10MB)

### API Key Issues
**Problem**: API key not working
**Solutions**:
- Verify key is copied completely (no spaces)
- Ensure Geocoding API is enabled in Geoapify dashboard
- Check key hasn't expired
- Try creating a new API key
- Clear browser cache and re-enter key

### No Addresses Found
**Problem**: File uploads but shows 0 addresses
**Solutions**:
- Verify file contains H2 records
- Check file format matches TFUK specification
- Ensure customer names or address1 fields aren't all empty
- Review browser console for parsing errors (F12)

### All Addresses Invalid
**Problem**: Every address shows as invalid
**Solutions**:
- Check if required fields are missing in source data
- Verify postcode/country fields are being parsed correctly
- Review sample address in browser console
- Check if field positions match TFUK spec

### Slow Validation
**Problem**: Validation takes very long
**Solutions**:
- Large files are normal (6 minutes for 1,000 addresses)
- Rate limiting is necessary to respect API limits
- Don't refresh page during validation
- Consider splitting large files

### 500 Errors
**Problem**: Multiple 500 errors from API
**Solutions**:
- Application automatically retries with simplified search
- May indicate special characters in address data
- Usually resolves automatically
- If persistent, contact Geoapify support

### Results Not Exporting
**Problem**: CSV or copy functions not working
**Solutions**:
- Check browser allows downloads
- Disable popup blockers
- Try different browser
- Ensure clipboard permissions enabled
- Check browser console for errors

## Browser Compatibility

### Fully Supported
- ✅ **Chrome** 90+ (Recommended)
- ✅ **Safari** 14+
- ✅ **Firefox** 88+
- ✅ **Edge** 90+

### Required Features
- JavaScript ES6+ support
- Fetch API
- LocalStorage API
- Clipboard API
- CSS Flexbox

### Mobile Support
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+
- ✅ Samsung Internet 14+

## Security & Privacy

### Data Protection
- **No Server Communication**: All processing happens in your browser
- **Local Processing**: TFUK files never leave your computer
- **API Key Security**: Keys stored only in browser localStorage
- **No Tracking**: No analytics or tracking scripts
- **No Third-Party Services**: Only communicates with Geoapify API

### API Key Storage
- Stored in browser's localStorage
- Specific to your browser and domain
- Not accessible to other websites
- Cleared when browser data is cleared
- Never transmitted except to Geoapify

### Data Retention
- **TFUK Files**: Not stored, only processed in memory
- **Results**: Only exist in browser session
- **API Key**: Persists in localStorage until manually cleared
- **Clear Data**: Use "Change Key" or clear browser data

## Technical Architecture

### Frontend Stack
- **HTML5**: Semantic markup
- **CSS3**: Bootstrap 5.3.0 for styling
- **JavaScript ES6+**: Modern JavaScript features
- **Font Awesome 6.4.0**: Icons

### Key Technologies
- **Fetch API**: HTTP requests to Geoapify
- **Promises/Async-Await**: Asynchronous processing
- **LocalStorage API**: API key persistence
- **Clipboard API**: Copy-to-clipboard functionality
- **File API**: TFUK file reading

### Design Patterns
- **Progressive Enhancement**: Works without JavaScript for basic viewing
- **Mobile-First**: Responsive from smallest to largest screens
- **Graceful Degradation**: Handles errors without breaking
- **Modular Functions**: Clear separation of concerns

## Comparison with Similar Tools

### vs TFUK Order Parser
**Similarities:**
- Same visual design and card layout
- Identical color-coding system
- Similar statistics dashboard
- Same copy/export functionality
- Matching toggle behavior

**Differences:**
- **Purpose**: Address validation vs order validation
- **API**: Uses Geoapify for geocoding
- **Focus**: Validates customer addresses specifically
- **Output**: Includes coordinates and formatted addresses

### vs Manual Validation
**Advantages:**
- Automated: Processes hundreds of addresses automatically
- Accurate: Uses professional geocoding service
- Fast: ~170 addresses per minute
- Consistent: Same rules applied to all addresses
- Documented: Comprehensive error reporting

**Disadvantages:**
- Requires API key
- Rate limited (3,000/day free tier)
- Internet connection required

## Best Practices

### For Best Results
1. **Complete Data**: Ensure TFUK files have complete address information
2. **Test Small**: Start with 5-10 addresses to verify setup
3. **Monitor Usage**: Track API requests in Geoapify dashboard
4. **Regular Validation**: Validate addresses as part of order processing
5. **Export Results**: Always export CSV for record-keeping
6. **Review Invalids**: Manually review invalid addresses
7. **Update API Key**: Rotate keys periodically for security

### File Management
- Keep original TFUK files as backup
- Export results immediately after validation
- Name exports with dates for tracking
- Store results with corresponding TFUK files

### Error Handling
- Review all invalid addresses manually
- Contact customers for missing required fields
- Document systematic issues for TFUK data provider
- Report persistent API issues to Geoapify

## Frequently Asked Questions

### General

**Q: Do I need a server to run this?**
A: No, it runs entirely in your browser. Just open `index.html`.

**Q: Is my data secure?**
A: Yes, all processing happens locally. Only address queries are sent to Geoapify for validation.

**Q: How much does it cost?**
A: The application is free. Geoapify offers 3,000 free requests per day.

**Q: Can I use this offline?**
A: No, internet connection required for Geoapify API calls.

### API & Limits

**Q: What happens when I hit the rate limit?**
A: You'll see "Rate limit exceeded" errors. Limits reset daily at midnight UTC.

**Q: Can I validate more than 3,000 addresses per day?**
A: Yes, upgrade to a paid Geoapify plan or split across multiple days.

**Q: How accurate is the validation?**
A: Very accurate for standard addresses. Uses professional geocoding service.

### File Format

**Q: What file format is required?**
A: TFUK EDI .txt files with H2 address records.

**Q: Can I use CSV files?**
A: No, this tool specifically parses TFUK EDI format.

**Q: What if my file has different format?**
A: The parser expects standard TFUK EDI format with fixed-width fields.

### Validation

**Q: Why are some addresses invalid?**
A: Missing required fields (Postcode, Country, Email, Phone) or address not found by Geoapify.

**Q: What if the address is wrong but marked valid?**
A: Geoapify found an address matching the query. Verify address accuracy manually.

**Q: Why don't Amazon orders need emails?**
A: Amazon orders are warehouse deliveries, not end-customer addresses.

### Export

**Q: What format is the export?**
A: CSV (comma-separated values) compatible with Excel, Google Sheets, etc.

**Q: Can I customize the export fields?**
A: Not currently, but you can delete unwanted columns in your spreadsheet software.

**Q: How do I save results?**
A: Click "Export Results CSV" to download, or use copy functions for text reports.

## Support & Feedback

### Getting Help

**For Application Issues:**
- Check this README thoroughly
- Review Troubleshooting section
- Check browser console for errors (F12)
- Try different browser
- Clear browser cache and retry

**For API Issues:**
- Review Geoapify documentation: [docs.geoapify.com](https://docs.geoapify.com/)
- Check Geoapify dashboard for usage and errors
- Contact Geoapify support for API problems

**For TFUK Format Questions:**
- Refer to TFUK EDI specification
- Contact your TFUK data provider
- Review existing TFUK Order Parser documentation

### Feature Requests

Potential future enhancements:
- Batch processing with progress save/resume
- Custom validation rules
- Multiple geocoding provider support
- Address correction suggestions
- Historical validation reports
- API usage statistics
- Email validation
- Phone number validation
- Custom export templates

## Version History

### Version 1.0.0 (Current)
**Release Date**: December 2024

**Features:**
- TFUK EDI H2 record parsing
- Required field validation
- Amazon order exception handling
- Geoapify integration with retry logic
- Data sanitization for API compatibility
- Progress tracking
- Statistics dashboard
- CSV export
- Copy to clipboard functions
- Responsive design
- API key management

## License

This application is provided as-is for address validation purposes. Modify and distribute according to your organization's requirements.

### Third-Party Services
- **Geoapify**: Subject to Geoapify Terms of Service
- **Bootstrap**: MIT License
- **Font Awesome**: Font Awesome Free License

## Credits

**Developed for**: Taylor & Francis UK book publishing workflows
**Geocoding**: Powered by Geoapify API
**UI Framework**: Bootstrap 5.3.0
**Icons**: Font Awesome 6.4.0
**Design**: Based on TFUK Order Parser aesthetic

---

## Quick Reference Card

### Required Fields
- ✅ Postcode
- ✅ Country Code
- ✅ Email (except Amazon)
- ✅ Phone

### Valid Address
- Has all required fields
- Found by Geoapify
- Shows green card

### Invalid Address
- Missing required fields, OR
- Not found by Geoapify
- Shows red card

### Rate Limits
- Free: 3,000/day
- Speed: ~170 addresses/minute
- Resets: Midnight UTC

### File Format
- Type: TFUK EDI .txt
- Records: H2 address records
- Encoding: UTF-8

### Support
- Docs: This README
- API: docs.geoapify.com
- Browser: Chrome recommended

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Application**: TFUK Address Validator with Geoapify
