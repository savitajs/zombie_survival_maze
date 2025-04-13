# Game Systems Documentation

## Player Systems

### Player Movement & Controls
- WASD/Arrow keys movement (Anuj Sevak)
- Camera-relative movement to make player move respective to Camera (Savitaj Singh)
- Mouse camera control (Anuj Sevak)
- Player model loading and animation (Anuj Sevak)
- Player collision with walls (Anuj Sevak)

### Player Health System
- Health bar UI (Savitaj Singh)
- Damage taking from zombies (Savitaj Singh)
- Health pack collection (Savitaj Singh)
- Death state (Anuj Sevak)

## Zombie Systems

### Zombie AI
- State machine (Idle, Approach, Attack, Death states) (Savitaj Singh)
- Pathfinding (A* algorithm) with path visualization (Savitaj Singh)
- Attack mechanics (mechanics - Savitaj Singh, animation - Anuj Sevak)

### Zombie Visuals
- Model loading (Anuj Sevak)
- Animations (Idle, Walk, Attack, Death) (Anuj Sevak)
- Individual health bars (Savitaj Singh)
- Health color changes (Green > Yellow > Red) (Savitaj Singh)

### Zombie Management
- Zombie spawning system (Savitaj Singh)
- Animation management (Anuj Sevak)
- State updates (Savitaj Singh)
- Position updates (Savitaj Singh)

## Environment

### Maze Generation
- Random maze generation (Anuj Sevak)
- Wall placement (Anuj Sevak)
- Valid path checking (Anuj Sevak)
- Node system for pathfinding (Anuj Sevak)

### Health Pack System
- Random spawning (Savitaj Singh)
- Collection detection (Savitaj Singh)
- Health restoration (Savitaj Singh)
- Visual representation (Savitaj Singh)

## Camera System

### Third Person Camera
- Following player (Savitaj Singh)
- Rotation with mouse (Savitaj Singh)
- Collision prevention (Anuj Sevak)
- Smooth transitions (Anuj Sevak)

## UI Elements

### Health Display
- Player health bar (Savitaj Singh)
- Zombie health bars (Savitaj Singh)
- Health pack indicators (Savitaj Singh)

### Game State UI
- Level display (Anuj Sevak)
- Game over message (Anuj Sevak)
- Mouse control status (Anuj Sevak)
- Victory conditions (Anuj Sevak)

## Core Systems

### Collision Systems
- Wall collisions (Anuj Sevak)
- Entity collisions (Anuj Sevak)
- Collision response (Savitaj Singh)
- Collision whiskers for zombies (Savitaj Singh)

### Animation System
- Model animation loading (Anuj Sevak)
- Animation transitions and mixing (Anuj Sevak)

### Scene Management
- Level loading/unloading (Anuj Sevak)
- Object cleanup (Anuj Sevak)
- Resource management (Savitaj Singh)

### Input System
- Keyboard input (Anuj Sevak)
- Mouse input (Anuj Sevak)
- Input state management (Anuj Sevak)

## Debug Systems

### Visual Debugging
- State debugging (Savitaj Singh)

## Utility Systems

### State Management
- Game state tracking (Anuj Sevak)
- Level progression (Anuj Sevak)