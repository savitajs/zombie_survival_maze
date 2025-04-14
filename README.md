# Zombie Survival Maze

## Description
Zombie Survival Maze is a 3D game where you navigate through procedurally generated mazes while avoiding zombies that hunt you using various AI techniques. Your goal is to find the exit in each level while managing your health and avoiding or defeating zombies.

## How to Run
1. Navigate to the `zombie-game` directory
2. Run `npm install`
3. Run `npx vite` and open the localhost link that is displayed by npx in the console.

## Controls
- **W, A, S, D**: Move the player (forward, left, backward, right)
- **Mouse**: Control the camera direction when mouse control is enabled
- **M**: Toggle mouse camera control
- **X**: Attack zombies (when close enough)

## Dev Controls (For debugging)
- **F**: Toggle free camera mode (for debugging and overview)
- **I, J, K, L**: Move camera when in free camera mode (for debugging and overview)

## Game Features
- Procedurally generated maze for each level
- Multiple levels with increasing difficulty
- Health system with damage and healing
- Health packs to restore player health
- Zombie enemies with AI-driven behavior
- Animated character models
- Victory and game over states

## Implemented Topics

### Core AI Implementation

#### 1. Procedural Content Generation
- **Depth-First Backtracking Maze Generation**
  - Located in `js/World/MazeGenerator.js`
  - Creates random mazes using depth-first search algorithm
  - Generates different layouts for each level
  - Adjustable parameters control maze density and complexity
  - Braided maze option adds loops to create multiple paths and reduce dead ends

#### 2. Decision Making
- **State Machine**
  - Player states in `js/Behaviour/Player.js` (IdleState, MovingState, DeathState)
  - Zombie states in `js/States/ZombieStates.js` (IdleState, ApproachState, AttackState, DeathState)
  - Each state manages specific behaviors and animations
  - Transitions between states based on game events and player proximity

#### 3. Pathfinding
- **A* Pathfinding**
  - Implemented in `js/Pathfinding/PathFinder.js`
  - Zombies use A* to find optimal paths to the player
  - Automatically adapts to maze layout
  - Visualized with debug tools (path lines for first zombie)

#### 4. Complex Movement Algorithms
- **Collision Avoidance**
  - Implemented in `js/Entities/ZombieCollisionHandler.js`
  - Uses whisker technique to detect and avoid walls
  - Multiple detection rays at different angles
  - Dynamic avoidance forces calculated based on collision detection
  - Allows zombies to navigate around obstacles

#### 5. Simple Movement Algorithms
- **Seek Behavior**
  - Implemented in `js/Entities/ZombieManager.js`
  - Zombies pursue the player when detected
  - Path following combines with seek behavior to navigate through maze walls
  - Force-based movement system for smooth motion

## How to View Each Topic in Action

### Procedural Maze Generation
- Start the game and observe the generated maze structure
- Progress to different levels to see various maze layouts
- Notice the maze complexity increases with level number

### State Machine
- Watch how zombies change behavior (idle, approach, attack) based on your proximity
- Observe player state changes between idle and moving as you press movement keys
- When player health reaches zero, the death state activates with unique animation

### Pathfinding
- Observe zombies navigating around walls to reach you
- Notice path visualization (first zombie) when debug mode is active
- Watch how zombies recalculate paths when you move to different locations

### Collision Avoidance
- Observe how zombies navigate around corners and avoid walls
- Note the smooth steering behavior when approaching obstacles
- When debug visualization is active, notice the whisker lines showing detection rays

### Seek Behavior
- Watch zombies actively pursue you when detected
- Notice the directional targeting and gradual acceleration/deceleration
- Observe how zombies combine path following with direct seeking for efficient pursuit

## Additional Notes
- The game features progressive difficulty with more zombies and larger mazes in higher levels
- Health packs are scattered throughout the maze to help you survive
- The exit is marked by a distinct wall color/animation
- Zombies can be defeated when attacked at close range
- Each level has a timer showing how long you've been surviving

## Credits
Models are sourced from online repositories with attribution provided in REFERENCES.md.