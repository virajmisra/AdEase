# Ad Volume Reducer Chrome Extension - Design Guidelines

## Design Approach
**System-Based Approach**: Following Chrome's extension design patterns and Material Design principles for consistency with browser ecosystem. This utility-focused tool prioritizes clarity and accessibility over visual flourish.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light mode: 220 15% 25% (deep blue-gray)
- Dark mode: 220 20% 85% (light blue-gray)

**Background Colors:**
- Light mode: 0 0% 98% (near white)
- Dark mode: 220 15% 12% (very dark blue-gray)

**Accent Colors:**
- Success (program detected): 142 76% 36% (green)
- Warning (ad detected): 25 95% 53% (orange-red)
- Neutral states: 220 10% 60% (medium gray)

### B. Typography
**Font Stack**: System fonts (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- Header: 16px, medium weight
- Body text: 14px, regular weight
- Status indicators: 12px, medium weight
- Buttons: 14px, medium weight

### C. Layout System
**Spacing**: Tailwind units of 2, 4, and 6 (8px, 16px, 24px)
- Consistent 4-unit (16px) padding for main sections
- 2-unit (8px) gaps between related elements
- 6-unit (24px) separation between distinct sections

### D. Component Library

**Extension Popup (320px width max)**:
- Header with extension name and status indicator
- Main control toggle (large, prominent switch)
- Current detection status with visual feedback
- Volume adjustment preview slider
- Settings access button

**Status Indicators**:
- Circular indicators with color coding
- "Program" state: Green circle with play icon
- "Ad Detected" state: Orange circle with volume-down icon
- "Processing" state: Gray circle with loading animation

**Controls**:
- Primary toggle switch for extension on/off
- Secondary sliders for volume thresholds
- Outline buttons for settings access

**Settings Panel**:
- Sensitivity adjustment sliders
- Volume reduction percentage control
- Model status and last update timestamp
- Clear, minimal form layout

### E. Interaction Patterns

**Real-time Feedback**:
- Immediate visual response when ads are detected
- Smooth color transitions for status changes
- Subtle pulse animation for active detection

**Volume Visualization**:
- Simple horizontal bar showing current vs. reduced volume
- Color-coded to match detection status

**Model Status**:
- Clear indicator of model loading/ready state
- Simple progress indication during initialization

## Key Design Principles

1. **Minimal Footprint**: Extension popup stays compact and focused
2. **Clear Status Communication**: Users always know what the extension is doing
3. **Accessibility First**: High contrast ratios, clear iconography, consistent navigation
4. **Chrome Native Feel**: Follows Chrome's design language for familiar user experience
5. **Performance Awareness**: Visual feedback doesn't interfere with video playback

## Visual Hierarchy
- Most prominent: Main toggle control
- Secondary: Current detection status
- Tertiary: Settings and configuration options
- Subtle: Model status and technical details

The design emphasizes functional clarity over visual decoration, ensuring users can quickly understand and control the extension's behavior without distraction from their video viewing experience.