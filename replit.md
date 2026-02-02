# Franklin Resource Hub

## Overview
Franklin Resource Hub is a static web application designed to help Franklin High School students find college resources, scholarships, and opportunities. The site features a clean, modern interface with dynamic content loading from Google Sheets and built-in search functionality.

**Current Status**: Fully functional and ready to use in Replit environment.

## Replit Environment Setup (October 29, 2025)
- Configured workflow to run http-server on port 5000 with 0.0.0.0 host and CORS enabled
- Created .gitignore file for Node.js dependencies
- Configured autoscale deployment for production publishing
- Verified server is running and serving all static files correctly
- No build step required (pure static HTML/CSS/JS)
- No backend component (uses Google Sheets API via OpenSheet)

## Recent Changes (November 2, 2025 - Latest Professional Design Update)
- **Professional Design Overhaul**: Complete redesign for a polished, modern look
  - Removed emojis from navigation buttons for cleaner, professional appearance
  - Pill-shaped navigation buttons with smooth transitions and hover effects
  - Animated golden shimmer bar at top of content area
  - Enhanced typography with better spacing, letter-spacing, and font weights
  - Refined color palette with professional green and gold accents
- **Enhanced Resource Cards**:
  - Cards now have subtle background color with smooth elevation on hover
  - Animated golden left border appears on hover
  - Larger, more prominent images with playful rotation effect
  - Better spacing and padding throughout
  - Pill-shaped action buttons with sweeping shine animation
- **Improved User Experience**:
  - Smoother animations using cubic-bezier easing functions
  - Better visual hierarchy with refined typography
  - Golden accent line on footer for cohesive design
  - Enhanced search input with golden glow on focus
- **Kept from Previous Updates**:
  - Animated floating bee emoji logo (🐝) in header - retained as requested
  - Opportunities section properly reads "title" field from Google Sheets
  - Shows "Untitled Opportunity #X: [notes preview]" for blank titles
  - Mobile responsiveness for all screen sizes

## Previous Changes (October 29, 2025)
- Improved visual design with gradients, shadows, hover effects, and smooth transitions
- Added mobile-friendly breakpoints for better viewing on all devices
- Enhanced resource cards with hover states and better spacing
- Removed AI assistant feature (placeholder functionality was not needed)
- Added search bar to Scholarships section (search by name)
- Added search bar to Opportunities section (search by name and category/type like STEM, Arts)
- Updated Opportunities section to display correct fields from Google Sheets: Name, Status, Notes, Deadline, Category
- Fixed search functionality to prevent input field from clearing while typing
- Improved code organization with helper functions for data normalization
- Added 6 college help resources with images to College Help section
- Added error handling for images that fail to load
- Added debugging logs to help troubleshoot Google Sheets data issues

## Previous Changes (October 20, 2025)
- Migrated from deprecated Tabletop.js to modern OpenSheet API for Google Sheets integration
- Made the data rendering flexible to work with various column header names
- Configured Node.js http-server for hosting on port 5000
- Set up deployment configuration for autoscale hosting
- Added project documentation

## Project Architecture

### Technology Stack
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Styling**: Custom CSS with Poppins font, gradients, and modern design elements
- **Data Source**: Google Sheets via OpenSheet API (modern, no-auth solution)
- **Server**: http-server (Node.js package for static file serving)

### File Structure
```
.
├── index.html          # Main HTML page
├── style.css           # All styling with modern design enhancements
├── script.js           # JavaScript logic, Google Sheets integration, and search
├── package.json        # Node.js dependencies
├── .gitignore          # Git ignore rules
└── replit.md          # This documentation file
```

### Features
1. **College Help Tab**: 
   - Displays Franklin High School Newspaper link
   - Shows 6 college resource cards with images:
     - California Student Aid Commission
     - Federal Student Aid
     - Common App
     - University of California
     - College Board
     - U.S. News
2. **Opportunities Tab**: 
   - Dynamically loads opportunities from Google Sheets
   - Search functionality by name or category (e.g., STEM, Arts, etc.)
   - Displays: Name, Status, Notes, Deadline, Category
3. **Scholarships Tab**: 
   - Dynamically loads scholarships from Google Sheets
   - Search functionality by scholarship name
   - Displays: Title, Description, Status, Area, Grade Level, Deadline, Link

### Google Sheets Integration
The app uses the OpenSheet API to fetch data from two Google Sheets:
- **Scholarships Sheet**: ID `1sfVjLdfJOFRxypFi1rHpDDulk0525u0SQK89_-_b5OM`
  - URL: https://docs.google.com/spreadsheets/d/1sfVjLdfJOFRxypFi1rHpDDulk0525u0SQK89_-_b5OM/edit
- **Resources/Opportunities Sheet**: ID `1ZT0ZYqoTlE-NOYZVRPMtHxoubZm-1GrMUzj2w02CI0I`
  - URL: https://docs.google.com/spreadsheets/d/1ZT0ZYqoTlE-NOYZVRPMtHxoubZm-1GrMUzj2w02CI0I/edit

**Important Setup Requirements:**
1. Both Google Sheets MUST be set to "Anyone with the link can view" (Share button → Change to "Anyone with the link")
2. The first row of each sheet should contain column headers
3. **Column Header Format**: Make sure column headers have NO extra spaces. For example, the header should be exactly `name` not `name ` or ` name`
4. The code flexibly handles various column names, supporting:
   - **Scholarships**: Title/Name, Description/Notes, Link/URL, Deadline, Status, Area, Grade Level, Image, Emoji
   - **Opportunities**: name/Name/Title, Status, Notes/Description, Deadline, Category/Area

**API Endpoints:**
- Scholarships: `https://opensheet.elk.sh/1sfVjLdfJOFRxypFi1rHpDDulk0525u0SQK89_-_b5OM/1`
- Opportunities: `https://opensheet.elk.sh/1ZT0ZYqoTlE-NOYZVRPMtHxoubZm-1GrMUzj2w02CI0I/1`

## Running the Project

### Development
The workflow is already configured. The server runs on port 5000 and serves all static files.

**Command**: `npx http-server -p 5000 -a 0.0.0.0 --cors`

### Deployment
The deployment is configured for autoscale hosting, which is ideal for static websites. When you publish the project, it will automatically use the same http-server setup.

## Troubleshooting

### If opportunities show "Untitled"
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1ZT0ZYqoTlE-NOYZVRPMtHxoubZm-1GrMUzj2w02CI0I/edit
2. Check the first row (column headers)
3. Make sure the column with opportunity names is labeled exactly as `name` (lowercase, no extra spaces)
4. If there are extra spaces, delete them and save the sheet
5. Wait 30 seconds for the OpenSheet API cache to refresh
6. Reload the page with a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Debug Mode
The application now includes console logging. To see debug information:
1. Open your browser's Developer Tools (F12 or right-click → Inspect)
2. Go to the Console tab
3. Click on the Opportunities tab in the app
4. You'll see logs showing what data was loaded and what keys are available

## User Preferences
None documented yet.

## Notes
- OpenSheet API has a 30-second cache, so changes to Google Sheets may take up to 30 seconds to appear
- The site uses CORS-enabled serving to allow external resource loading
- Resources can be managed by editing the Google Sheets directly
- If sheets don't load, verify they are publicly accessible via "Anyone with the link can view"
- Search is case-insensitive and filters results in real-time as you type
- Empty state messages appear when no results match the search query
- Images that fail to load are automatically hidden
- **Important**: If you see cached content, do a hard refresh (Ctrl+Shift+R on Windows/Linux or Cmd+Shift+R on Mac)
