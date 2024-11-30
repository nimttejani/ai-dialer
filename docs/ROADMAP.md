# Development Roadmap

This document outlines the upcoming development priorities for the AI Dialer proof-of-concept.

## Priority Tasks

### 1. End-of-Call Report Handling
- Complete testing of end-of-call report processing
- Ensure proper data capture and storage
- Add error handling and validation

### 2. Call Tracking Enhancement
- Create dedicated calls table for storing call records
- Store VAPI call IDs and raw response data
- Store end-of-call report JSON
- Add indexes for efficient querying
- Associate call records with leads
- Extract and store key metrics from call data

### 3. Settings Implementation
- Complete settings page UI implementation
- Add settings persistence
- Implement settings validation
- Add user feedback for settings changes

### 4. Dashboard Development
- Create dashboard UI for call activity overview
- Implement recent calls summary
- Add key metrics and statistics
- Include data visualization components

### 5. Lead Management Enhancement
- Implement lead search functionality
- Add filtering capabilities to lead table
- Optimize query performance
- Add sorting options

### 6. Call Status Management
- Implement maximum call duration checker
- Create process to reset stale "calling" states
- Add logging for status changes
- Implement error handling for edge cases

### 7. Scheduling Logic Implementation
- Implement concurrency limits for call scheduling
- Add queue management system
- Ensure proper handling of scheduling conflicts
- Add monitoring and logging for scheduling operations
