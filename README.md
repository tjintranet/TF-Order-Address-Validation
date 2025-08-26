# TFUK Order Parser & Validator

A web-based application for parsing and validating Taylor & Francis UK (TFUK) EDI order files. This tool processes fixed-width EDI format files, extracts order information, validates data completeness, and provides an intuitive interface for reviewing orders and identifying issues.

## Features

- **Automatic File Parsing**: Upload .txt files in TFUK EDI format for immediate processing
- **Comprehensive Validation**: Validates order headers, customer information, payment terms, and line items
- **Visual Status Indicators**: Color-coded cards show validation status at a glance
- **Filter Controls**: Toggle to hide valid orders and focus on problematic ones
- **Order Details Preview**: View customer names, addresses, postcodes, phone numbers, and email addresses
- **Copy Functionality**: Copy individual order details or bulk copy invalid orders for email reporting
- **Responsive Design**: Works on desktop and mobile devices

## Supported File Format

The application processes TFUK EDI files with the following record types:

- **H1 Records**: Order headers with dates, references, and document details
- **H2 Records**: Customer and address information (ship-to and carrier addresses)
- **H3 Records**: Payment terms (FCA/DAP)
- **D1 Records**: Line items with quantities, prices, and ISBN identifiers

## Browser Compatibility

- Chrome (recommended)
- Safari
- Firefox
- Edge

Note: The application has been specifically optimized for Safari compatibility.

## Installation

1. Download the files:
   - `index.html`
   - `script.js`

2. Place both files in the same directory on your web server

3. Ensure your web server serves static files (no server-side processing required)

## Usage

1. Open the application in your web browser
2. Click "Choose File" and select a TFUK EDI .txt file
3. The file will be parsed automatically upon selection
4. Review the statistics dashboard showing totals for valid, warning, and invalid orders
5. Use the "Hide valid orders" toggle to focus on problematic orders
6. Click the copy button on individual orders to copy details to clipboard
7. Use "Copy Invalid Orders" to bulk copy all problematic orders for reporting

## Validation Rules

### Order Headers (H1 Records)
- Order number must be present
- Date must be in YYYYMMDD format
- Currency should be specified

### Customer Information (H2 Records)
- Customer name is required
- Address line 1 is required
- City is required
- Postal code is recommended
- Email format must be valid when present
- Phone number is recommended

### Payment Terms (H3 Records)
- Must be FCA (Free Carrier) or DAP (Delivered at Place)

### Line Items (D1 Records)
- ISBN must be valid 13-digit format starting with 978 or 979
- Quantity must be greater than 0
- Price must be greater than 0
- Item reference is recommended

## File Structure

```
your-web-directory/
├── index.html          # Main HTML file with UI components
└── script.js           # JavaScript parser and validation logic
```

## Dependencies

The application uses CDN-hosted libraries:

- Bootstrap 5.3.0 (UI framework)
- Font Awesome 6.4.0 (icons)

No local dependencies or build process required.

## Technical Details

### File Processing
- Parses fixed-width records according to TFUK EDI specification
- Extracts quantity from 28-character embedded blocks
- Converts prices from pence to pounds
- Handles multiple customer records per order

### Data Validation
- Real-time validation during parsing
- Three validation levels: Success (green), Warning (yellow), Error (red)
- Detailed error and warning messages for each order

### User Interface
- Clean, professional design with subtle dashboard
- Responsive layout adapting to different screen sizes
- Toast notifications for user feedback
- Accessibility considerations with proper contrast and semantic markup

## Sample File Format

```
$$HDRTFUK 0023544   20250825160339
H17000798008     20250825                              C 8250374-5...
H27000798008     ST0070000049               Gardners Books Ltd...
H37000798008     FCA
D17000798008     8250374-5                00001   ...
$$EOFTFUK 0023544   202508251603390000110
```

## Troubleshooting

**File not parsing:**
- Ensure file is in .txt format
- Check that file follows TFUK EDI specification
- Verify file contains proper header/footer markers

**Dashboard not displaying horizontally:**
- Clear browser cache and refresh
- Ensure browser supports flexbox (all modern browsers)

**Copy to clipboard not working:**
- Ensure browser supports Clipboard API
- Check that page is served over HTTPS in production

## License

This application is provided as-is for parsing TFUK EDI files. Modify and distribute according to your organization's requirements.

## Version

Current version: 1.0

## Support

For technical issues or feature requests, refer to your internal development team or system administrator.