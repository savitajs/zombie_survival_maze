# Game Systems Documentation

## Player Systems

### Player Movement & Controls
- WASD/Arrow keys movement (Anuj Sevak)
- Camera-relative movement to make player move respective to Camera (Savitaj)
- Mouse camera control (Anuj)
- Player model loading and animation (Anuj)
- Player collision with walls (Anuj)

### Player Health System
- Health bar UI (Savitaj)
- Damage taking from zombies (Savitaj)
- Health pack collection (Savitaj)
- Death state (Anuj)

## Zombie Systems

### Zombie AI
- State machine (Idle, Approach, Attack, Death states) (Savitaj)
- Pathfinding (A* algorithm) with path visualization (Savitaj)
- Attack mechanics (mechanics - Savitaj, animation - Anuj)

### Zombie Visuals
- Model loading (Anuj)
- Animations (Idle, Walk, Attack, Death) (Anuj)
- Individual health bars (Savitaj)
- Health color changes (Green > Yellow > Red) (Savitaj)

### Zombie Management
- Zombie spawning system (Savitaj)
- Animation management (Anuj)
- State updates (Savitaj)
- Position updates (Savitaj)

## Environment

### Maze Generation
- Random maze generation (Anuj)
- Wall placement (Anuj)
- Valid path checking (Anuj)
- Node system for pathfinding (Anuj)

### Health Pack System
- Random spawning (Savitaj)
- Collection detection (Savitaj)
- Health restoration (Savitaj)
- Visual representation (Savitaj)

## Camera System

### Third Person Camera
- Following player (Savitaj)
- Rotation with mouse (Savitaj)
- Collision prevention (Anuj)
- Smooth transitions (Anuj)

## UI Elements

### Health Display
- Player health bar (Savitaj)
- Zombie health bars (Savitaj)
- Health pack indicators (Savitaj)

### Game State UI
- Level display (Anuj)
- Game over message (Anuj)
- Mouse control status (Anuj)
- Victory conditions (Anuj)

## Core Systems

### Collision Systems
- Wall collisions (Anuj)
- Entity collisions (Anuj)
- Collision response (Savitaj)
- Collision whiskers for zombies (Savitaj)

### Animation System
- Model animation loading (Anuj)
- Animation transitions and mixing (Anuj)

### Scene Management
- Level loading/unloading (Anuj)
- Object cleanup (Anuj)
- Resource management (Savitaj)

### Input System
- Keyboard input (Anuj)
- Mouse input (Anuj)
- Input state management (Anuj)

## Debug Systems

### Visual Debugging
- State debugging (Savitaj)

## Utility Systems

### State Management
- Game state tracking (Anuj)
- Level progression (Anuj)