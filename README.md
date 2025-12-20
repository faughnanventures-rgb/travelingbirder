# 🦩 Traveling Birder v7.2 - Modular Edition

A powerful route-based birding tool that helps you find target species along your travels using eBird data.

## 📁 Project Structure

```
traveling-birder/
├── index.html              # Main HTML shell (~200 lines)
├── css/
│   ├── main.css           # Core styles & variables
│   ├── sidebar.css        # Sidebar layout
│   ├── map.css            # Map container & legend
│   ├── panels.css         # Below-map panels
│   └── modals.css         # Modal overlays
├── js/
│   ├── config.js          # ✅ Configuration & constants
│   ├── state.js           # ✅ Global state management
│   ├── ebird-api.js       # ✅ eBird API calls
│   ├── storage.js         # ✅ localStorage management
│   ├── ui.js              # ✅ UI helpers & interactions
│   ├── routes.js          # ✅ Save/load/share routes
│   ├── csv-export.js      # ✅ CSV import/export
│   ├── map.js             # 🔄 Google Maps (to be created)
│   ├── search.js          # 🔄 Search logic (to be created)
│   ├── markers.js         # 🔄 Marker management (to be created)
│   ├── targets.js         # 🔄 Target identification (to be created)
│   ├── checklists.js      # 🔄 Checklist processing (to be created)
│   ├── hotspots.js        # 🔄 Hotspot processing (to be created)
│   ├── top-ebirders.js    # 🔄 Top eBirders panel (to be created)
│   └── main.js            # 🔄 App initialization (to be created)
└── README.md              # This file

✅ = Complete | 🔄 = To be created
```

## 🚀 Features (v7.2)

### Core Features
- ✅ Route planning with multiple waypoints
- ✅ Area searching (states, counties, regions)
- ✅ Species-specific searching
- ✅ Life list integration (eBird API + CSV import)
- ✅ Target identification (expected + notable)
- ✅ Map visualization with Google Maps
- ✅ Dark mode support

### New in v7.2
- ✅ **Fixed Checklist Filtering** - Checklists show true species counts
- ✅ **Save/Share Routes** - Save routes and share via URL
- ✅ **Enhanced CSV Export** - 14-column detailed exports
- ✅ **Panel Click Fix** - Only headers toggle panels
- ✅ **Top 10 Regional eBirders** - Compare with top birders

### Display Features
- ✅ Top 10 hotspots with species counts
- ✅ Top 10 checklists by species diversity
- ✅ Area statistics (your progress vs region total)
- ✅ Target species cards with frequency data
- ✅ ABA rarity filtering

## 📦 Module Overview

### **config.js** - Configuration
- API endpoints and keys
- Default values and constraints
- US state/region codes
- ABA rarity codes
- Storage keys

### **state.js** - State Management
- Centralized application state
- State update functions
- Authentication status
- User data (life list, observations)
- UI state (dark mode, loading)

### **ebird-api.js** - eBird API
- `getObservations()` - Get observations by location
- `getRegionObservations()` - Get observations by region
- `getLifeList()` - Fetch user's life list
- `getTopObservers()` - Get top eBirders
- `getHotspots()` - Get nearby hotspots
- `getNotableObservations()` - Get rare birds
- `testApiKey()` - Validate API key

### **storage.js** - Local Storage
- `saveToStorage()` / `loadFromStorage()` - Generic storage
- `saveLifeList()` / `loadLifeList()` - Life list management
- `saveCredentials()` / `loadCredentials()` - API key management
- `saveSavedRoutes()` / `loadSavedRoutes()` - Route persistence
- `saveDarkMode()` / `loadDarkMode()` - Theme preference

### **ui.js** - User Interface
- `showLoading()` / `hideLoading()` - Loading overlay
- `showModal()` / `closeModal()` - Modal dialogs
- `togglePanel()` - Panel expansion
- `showError()` / `showSuccess()` - User notifications
- `toggleDarkMode()` - Theme switching
- `copyToClipboard()` - Clipboard operations
- Date/time formatting utilities

### **routes.js** - Route Management
- `saveCurrentRoute()` - Save route with name
- `loadRoute()` - Load saved route
- `deleteRoute()` - Remove route
- `shareRoute()` - Generate share URL
- `loadRouteFromURL()` - Auto-load from shared link
- `displaySavedRoutes()` - Show saved routes list
- `exportRoutes()` / `importRoutes()` - Bulk route management

### **csv-export.js** - Data Export
- `importLifeListCSV()` - Import eBird CSV
- `exportLifeListCSV()` - Basic export
- `exportEnhancedLifeList()` - 4-column enhanced export
- `exportSearchResults()` - Basic results export
- `exportEnhancedSearchResults()` - 14-column detailed export
- `exportChecklists()` - Checklist export
- `exportHotspots()` - Hotspot export
- `exportTargets()` - Target species export

## 🔧 Setup & Installation

### Prerequisites
- Web server (local or hosted)
- eBird API key (get from https://ebird.org/api/keygen)
- Google Maps API key (already included)

### Quick Start
1. Clone or download the repository
2. Open `index.html` in a web browser
3. Enter your eBird API key when prompted
4. Start planning routes and finding birds!

### Development Setup
```bash
# If using a local server
python -m http.server 8000
# or
npx serve
```

Then open `http://localhost:8000` in your browser.

## 📖 Usage Guide

### Getting Started
1. **Connect to eBird**: Enter your API key
2. **Import Life List**: Upload your eBird CSV for full history
3. **Choose Search Mode**:
   - **Plan Route**: Origin → Destination
   - **Search Area**: State, county, or location
   - **Species Search**: Find specific species

### Planning a Route
1. Enter origin and destination
2. Optionally add waypoints
3. Set search radius (up to 31 miles)
4. Set time range (7 days to 1 year)
5. Click "Plan Route"
6. Save route for later or share with friends

### Saving & Sharing Routes
1. After planning a route, click "Save Route"
2. Enter a name and notes
3. Route appears in "Saved Routes" section
4. Click "Share" to copy URL link
5. Send link to friends - they can load your route instantly

### Filtering Results
- **All Species**: Show everything
- **Life List Targets**: Only birds you haven't seen
- **Expected Seasonal Targets**: Common birds for the season
- **ABA Rarity Filter**: Filter by rarity (1-6)
- **Region Boundaries Only**: Restrict to exact political boundaries

### Exporting Data
- **Life List** - Export your complete list
- **Search Results** - Export current map results
- **Enhanced Exports** - 14-column detailed CSV with:
  - Checklist links
  - Hotspot rankings
  - Your status (Seen/Not Seen)
  - Target type classification
  - Observer names and dates

## 🛠️ Development

### Adding a New Module

1. Create the module file:
```javascript
// js/my-module.js
import { state } from './state.js';
import { CONFIG } from './config.js';

export function myFunction() {
    // Your code here
}
```

2. Import in main.js:
```javascript
import { myFunction } from './my-module.js';
```

3. Use in your code:
```javascript
myFunction();
```

### Module Dependencies

```
config.js (no dependencies)
  ↓
state.js (imports config)
  ↓
ebird-api.js (imports config, state)
storage.js (imports config)
ui.js (imports state)
  ↓
routes.js (imports state, storage, ui)
csv-export.js (imports state, storage, ui)
[other modules...]
```

### Best Practices

1. **Keep modules focused**: Each module should have a single responsibility
2. **Use ES6 imports**: Always use `import/export` syntax
3. **Document functions**: Add JSDoc comments for public functions
4. **Handle errors**: Use try-catch and provide user feedback
5. **Log actions**: Use console.log for debugging
6. **Test thoroughly**: Test after each change

## 🐛 Troubleshooting

### Common Issues

**Modules not loading**
- Ensure you're using a web server (not file://)
- Check browser console for errors
- Verify all import paths are correct

**API errors**
- Check your eBird API key is valid
- Verify internet connection
- Check eBird API status

**localStorage issues**
- Check browser privacy settings
- Clear localStorage if corrupted
- Check storage quotas

### Debug Mode

Open browser console and run:
```javascript
import { state } from './js/state.js';
console.log(state); // View current state
```

## 📝 API Reference

### State Object
```javascript
{
    map: GoogleMap,
    userApiKey: string,
    userName: string,
    userList: Set<string>,
    allObservations: Array,
    allSightings: Array,
    targetSpecies: Array,
    savedRoutes: Array,
    isDarkMode: boolean,
    isLoading: boolean
}
```

### Configuration
```javascript
CONFIG.EBIRD_API_BASE          // eBird API base URL
CONFIG.MAX_RADIUS_MILES        // 31 miles max
CONFIG.DEFAULT_TIME_RANGE      // 30 days
CONFIG.ABA_CODES               // Rarity codes
CONFIG.REGIONS                 // US states
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

- **eBird API**: Cornell Lab of Ornithology
- **Google Maps API**: Google
- **Developer**: faughnan-ventures@gmail.com

## 🔮 Roadmap

### Planned Features
- County-level region support
- Species photos from Macaulay Library
- Weather integration
- Multi-day trip planner
- Offline support
- Mobile app version

### In Progress
- Remaining modules extraction
- Build tool setup (Vite)
- TypeScript conversion
- Unit tests

## 📊 Version History

**v7.2** (Current - Modular)
- ✅ Modular architecture
- ✅ Fixed checklist filtering
- ✅ Save/share routes
- ✅ Enhanced CSV export
- ✅ Panel click fix

**v7.1**
- Top 10 Regional eBirders
- Independent time ranges
- Footer documentation

**v7.0**
- Region boundaries mode
- Species search improvements
- Dark mode fixes

**v6.x**
- Initial release
- Route planning
- Area search
- Life list integration

---

**🦩 Happy Birding! 🦩**

For support or questions: faughnan-ventures@gmail.com
