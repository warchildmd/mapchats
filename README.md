# PRD: GeoPost (Waze-Reddit Hybrid)

## Overview
GeoPost is a social platform that merges the real-time, location-based utility of Waze with the community-driven content of Reddit. Users interact with a map-based interface to discover and create posts tied to their physical location.

## Core Features

### 1. Map-Centric Interface
- **Main View:** A high-fidelity map is the primary navigation element.
- **Dynamic Pins:** Posts are represented as pins. Pin density and visibility adjust based on zoom level (Global vs. Local).
- **Popularity Scaling:** More popular posts appear larger or more prominent when zoomed out.

### 2. Location-Based Posting
- **Proximity Restriction:** Users can only create posts within a small radius (+-1km) of their current GPS location.
- **Permission Dependent:** The "Create Post" functionality is disabled if location permissions are not granted.

### 3. Post Lifetime & Decay
- **Initial Lifetime:** Every post starts with a base lifetime (e.g., 24 hours). The lifetime is dispayed on the post page itself.
- **Engagement Extension:** Upvotes and comments extend the post's life.
- **Maximum Cap:** A post can live for a maximum of 7 days before disappearing from the map.

### 4. Nested Social Interaction
- **Post Details:** Tapping a pin opens a post view.
- **Threading:** Support for comments and sub-comments (nested threading, by default posts are collapsed, only on click expand it's expanded with subcomments - lazy loading, don't need to introduce margins to indicate child comment, needs something more mobile friendly).
- **Voting:** Upvote/downvote system for both posts and comments.

### 5. Gamification (Karma/Points)
- **User Reputation:** Users earn points based on the net upvotes of their contributions.
- **Profile Integration:** Points are displayed on user profiles.

## User Flows
1. **Discovery:** Open app -> View map -> Zoom in/out -> Tap pin -> Read post & comments.
2. **Contribution:** Tap '+' button -> (Check Proximity) -> Create Post -> Set Category -> Publish.
3. **Engagement:** Open post -> Upvote/Downvote -> Add Comment -> Reply to Comment.

## Design Aesthetic
- **Modern & Dynamic:** Clean map tiles (Dark or Light mode).
- **Social & Friendly:** Vibrant pin colors based on post categories (e.g., Alert, Discussion, Event).
- **Intuitive Hierarchy:** Clear distinction between "Fresh" and "Trending" content.