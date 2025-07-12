# Tribal Wars Auto Builder

A comprehensive automated building system for Tribal Wars with clean database architecture and modular design.

## Features

- 🤖 **Automated Building**: Intelligent building system that follows your plans
- 📊 **Resource Monitoring**: Real-time resource tracking with warnings
- 🗄️ **Clean Database**: Separate databases for villages, resources, buildings, queues, and plans
- ⚙️ **Flexible Settings**: Comprehensive settings system with import/export
- 🎛️ **User Interface**: Modern UI panels for settings and queue management
- 🔧 **Modular Design**: Scalable architecture with separate modules

## Project Structure

```
AutoBuild/
├── main.user.js              # Main userscript entry point
├── src/
│   ├── database/
│   │   ├── DatabaseManager.js    # Database operations
│   │   └── DataCollector.js      # Game data collection
│   ├── bot/
│   │   ├── AutoBuildBot.js       # Main bot logic
│   │   ├── ResourceMonitor.js    # Resource monitoring
│   │   └── QueueManager.js       # Queue management
│   ├── ui/
│   │   ├── SettingsPanel.js      # Settings UI
│   │   ├── BuildQueueUI.js       # Queue UI (placeholder)
│   │   └── VillageManager.js     # Village UI (placeholder)
│   ├── utils/
│   │   ├── DataHelper.js         # Data processing utilities
│   │   ├── BuildingCosts.js      # Building cost calculations
│   │   ├── TimeUtils.js          # Time formatting utilities
│   │   └── GameUtils.js          # Game-specific utilities
│   └── config/
│       ├── Settings.js           # Settings management
│       └── BuildingConfig.js     # Building configuration
└── README.md
```

## Database Architecture

The system uses localStorage with separate databases:

- **villages_db**: Complete village information
- **resources_db**: Current resource levels
- **built_buildings_db**: Current building levels
- **active_queue_db**: Current building queue
- **future_plans_db**: Planned future buildings
- **settings_db**: User settings

## Installation

1. Install a userscript manager (Tampermonkey, Greasemonkey, etc.)
2. Copy the contents of `main.user.js`
3. Create a new userscript and paste the code
4. Save and enable the script
5. Visit Tribal Wars and look for the Auto Builder interface

## Usage

### Basic Setup

1. **Enable Auto Building**: Open settings and enable "Auto Building"
2. **Set Check Interval**: Choose how often to check for building opportunities (10-300 seconds)
3. **Configure Resource Monitoring**: Set warning thresholds for resources
4. **Add Building Plans**: Use the Village Manager to add future building plans

### Settings

- **Bot Settings**: Enable/disable auto building, set intervals
- **Resource Monitoring**: Configure resource warnings and thresholds
- **UI Settings**: Control which panels are visible
- **Import/Export**: Save and load your settings

### Building Plans

Add building plans through the Village Manager:
- Select building type
- Set target level
- Set priority (optional)
- Save plan

The bot will automatically:
- Check if resources are available
- Verify queue capacity
- Build according to priorities
- Update database with progress

## Development

### Adding New Features

1. **Database Layer**: Add new database operations in `DatabaseManager.js`
2. **Bot Logic**: Extend `AutoBuildBot.js` for new automation features
3. **UI Components**: Create new UI classes in the `ui/` folder
4. **Utilities**: Add helper functions in the `utils/` folder

### File Structure Guidelines

- **Database**: All data persistence operations
- **Bot**: Automation and logic
- **UI**: User interface components
- **Utils**: Helper functions and utilities
- **Config**: Configuration and settings

### Code Style

- Use ES6+ features
- Add JSDoc comments for all functions
- Follow consistent naming conventions
- Handle errors gracefully
- Log important events to console

## Configuration

### Building Priorities

Default building priorities (lower number = higher priority):
1. Main Building
2. Barracks
3. Stable
4. Workshop
5. Academy
6. Smithy
7. Marketplace
8. Wall
9. Farm
10. Warehouse
11. Hiding Place

### Resource Thresholds

- **Warning Threshold**: Percentage at which resource warnings appear (default: 80%)
- **Check Interval**: How often to check resources (default: 60 seconds)

## Troubleshooting

### Common Issues

1. **Script not loading**: Check userscript manager and browser console
2. **Settings not saving**: Check localStorage permissions
3. **Bot not building**: Verify auto building is enabled and resources are available
4. **Queue issues**: Check queue capacity and current building status

### Debug Mode

Enable debug mode in settings to see detailed console logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Feel free to modify and distribute.

## Support

For issues and questions:
- Check the console for error messages
- Verify settings are correct
- Test with debug mode enabled
- Report bugs with detailed information

---

**Note**: This is a work in progress. Some UI components are placeholders and will be implemented in future versions. 