/**
2025-10-30
P5.js Project: Two-Player Peer-to-Peer Real-Time Strategy Game
 
Self Evaluation:
	Shapes
		Line - Scrolling Background, Units Direction Indicator, Unit Selection Indicator, Health Bars
		Point - Units, Projectiles, Structures, Projectile Explosion	// Circles are avoided as much as possible because Points achieve the same visual output and are much more optimized
		Circle - Projectiles Explosion	// The only case where only the circle outline is required
		Rectangle - Selection box
		Custom shape - Structures
		Text - End Screen
	Colours
		Blue - Player 1 Units and Structure
		Red - Player 2 Units and Structure, Fired Projectiles
		Orange - Projectile Explosion
		Green - Scrolling Background
		Green to Red blend - Health Bars
		Grey - Scrolling Background, Structures
		White - Units, Structures, End Text
		Black - Health Bar Background, End Background
	Custom shape
		Structures
	Loops
		Main game loop in draw function
		Looping through units and projectiles
	6 Different elements
		Scrolling Background
		Selection box
		Units
		Structures
		Projectiles
		Projectile Explosions
		Health Bars
		End Screen
	Overall Appearance
		Smooth movement of Units and Viewport
		Unit colours look bright on the neutral background
	2 animated elements
		Scrolling Background and Viewport
		Selection box
		Unit movement
		Structure unit creation
		Fired Projectiles
		Projectile Explosions
		Health Bars
	User mouse control
		Drag mouse to create selection box
		Left click to attack other units or structures
		Left click to move Units
		Right click to unselect
	Use keyboard control
		Arrow keys used to move the viewport around the world
		"A" key used to select all units
		"S" key used to scatter selected units
		"H" key to return to Home Structure
		"O" key to return to Home Structure
	Comments on "Draw" commands
		Yes, comments provided where necessary
	Comments on loops and ifs
		Yes, comments provided where necessary
	Prompts / Ease of use
		Instructions to play and connect to other player are included on the start screen
		Intuitive visual feedback within the game
		Continue button after game ends to avoid having to reconnect
	Header Done
*/

// For selection box
let startX = 0;
let startY = 0;

// For mouse state
let mouseDown = false;

// Declare global variables
let world;
let viewport;
let p2p;
let localSide = null;
let connectionEstablished = false;
let gameDone = false;

// Declare global constants
const UNIT_CREATION_FRAMES = 400;
const PLAYER0_POSITION = {x: 0, y: 0};
const PLAYER1_POSITION = {x: 6000, y: 0};
const VIEWPORT_MAX_ACCELERATION = 6;

// P5.js setup function
function setup() {
	createCanvas(windowWidth, windowHeight);
	initGame();
}

// This is called to (re)initialize the game
function initGame() {
	// Hide continue button
	document.getElementById("continue").style.display = "none";

	// Viewport defined in viewport.js
	viewport = new Viewport(0, 0);

	// World defined in world.js
	world = new World();

	// Pass reference of viewport to world for easier access
	world.attachViewport(viewport);

	if (localSide!=null) {
		// Position viewport based on player side
		if (localSide==0) {
			viewport.position.x = -windowWidth/2+PLAYER0_POSITION.x;
			viewport.position.y = -windowHeight/2+PLAYER0_POSITION.y;
		} else {
			viewport.position.x = -windowWidth/2+PLAYER1_POSITION.x;
			viewport.position.y = -windowHeight/2+PLAYER1_POSITION.y;
		}
	}
}

// This function is called when player 0 clicks "Continue" after a game ends
function continueGame() {
	initGame();
	connectionEstablished = true;
	gameDone = false;

	// Inform other player to continue as well
	if (localSide==0) {
		p2p.sendData(1)
	}
}


// P5.js draw function
function draw() {
	// End screen
	if (gameDone) {
		world.endMessage();
		if (localSide==0) {
			document.getElementById("continue").style.display = "block";
		}
		return;
	}

	// Check if connection is established
	if (p2p && p2p.dataChannel && p2p.dataChannel.readyState=="open") {
		connectionEstablished = true;
		document.getElementById("shareCode").style.display = "none";
		document.getElementById("instructions0").style.display = "none";
		document.getElementById("instructions1").style.display = "none";
	}

	// Main game loop
	if (connectionEstablished) {
		// "S" key to scatter units
		if (keyIsDown(83)) {
			world.spreadUnits();
		}

		world.update();

		// Draw selection box
		noFill();
		stroke(255);
		strokeWeight(2);
		if (mouseDown) {
			rect(startX, startY, mouseX-startX, mouseY-startY);
		}

		p2p.sendData(world.encodedData);
	} else {
		// Start screen background
		background(0)
	}
}

// Set canvas size to window size
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

// The mouse click is recorded by this function
function mousePressed() {
	if (gameDone) {
		return;
	}
	if (connectionEstablished) {
		if (mouseButton==LEFT) {
			mouseDown = true;
			startX = mouseX;
			startY = mouseY;
		} else {
			// Right click to unselect all units
			world.unselect();
		}
	}
}

// The mouse release is recorded by this function
function mouseReleased() {
	if (gameDone) {
		return;
	}
	if (connectionEstablished) {
		if (mouseButton==LEFT) {
			// 4px tolerance to register click
			if (abs(startX-mouseX)>2 || abs(startX-mouseX)>2) {
				world.select(viewport.screenToWorld(startX, startY), viewport.screenToWorld(mouseX, mouseY));
			} else {
				// Based on current mouse position. 
				let attackTarget = world.getAttackTarget();
				
				// Loop through all selected units and set their target
				for (let unitId in world.localData.selected) {
					let unit = world.localData.selected[unitId];
					unit.target = viewport.screenToWorld(mouseX, mouseY);
					unit.attackTarget = attackTarget;
				}
			}
			mouseDown = false;
		}
	}
}

// Function is called once when a key is pressed, not held
function keyPressed() {
	if (gameDone) {
		return;
	}
	if (connectionEstablished) {
		// "A" key to select all units
		if (key==="a" || key==="A") {
			world.selectAll();
		}
		// "H" key to return to home structure
		if (key==="h" || key==="H") {
			if (localSide==0) {
				viewport.position.x = -windowWidth/2+PLAYER0_POSITION.x;
				viewport.position.y = -windowHeight/2+PLAYER0_POSITION.y;
			} else {
				viewport.position.x = -windowWidth/2+PLAYER1_POSITION.x;
				viewport.position.y = -windowHeight/2+PLAYER1_POSITION.y;
			}
		}
		// "O" key to go to other player's structure
		if (key==="o" || key==="O") {
			if (localSide==0) {
				viewport.position.x = -windowWidth/2+PLAYER1_POSITION.x;
				viewport.position.y = -windowHeight/2+PLAYER1_POSITION.y;
			} else {
				viewport.position.x = -windowWidth/2+PLAYER0_POSITION.x;
				viewport.position.y = -windowHeight/2+PLAYER0_POSITION.y;
			}
		}
	}
}



function setupP2P() {
	// Create new data channel. P2PDataChannel is defined in p2p.js.
	p2p = new P2PDataChannel();

	// Function will run when a share code is generated
	p2p.onSignalGenerated = (signal) => {
		navigator.clipboard.writeText(signal);
		document.getElementById("shareCode").textContent = signal;
	}

	// Function will run when data is received from the other peer
	p2p.onDataReceived = (data) => {
		if (data=="1") {
			continueGame();
		} else {
			world.decodeRemoteData(data);
		}
	}
}


// This runs first
window.onload = () => {
	setupP2P();

	// Remove the right click pop-up menu
	document.oncontextmenu = function() { return false; }

	// If there is an offer encoded into the URL, find it.
	let hash = window.location.hash;
	if (hash.startsWith("#offer=")) {
		// Answerer
		document.getElementById("instructions0").style.display = "none";
		document.getElementById("instructions1").style.display = "block";

		localSide = 1;
		viewport.position.x = -windowWidth/2+PLAYER1_POSITION.x;
		viewport.position.y = -windowHeight/2+PLAYER1_POSITION.y;

		let encodedSignal = hash.substring("#offer=".length).trim();
		decoded = decodeURIComponent(encodedSignal);
		p2p.process(decodeURIComponent(encodedSignal));
	} else {
		// Initiator
		document.getElementById("instructions0").style.display = "block";
		document.getElementById("instructions1").style.display = "none";

		localSide = 0;
		viewport.position.x = -windowWidth/2+PLAYER0_POSITION.x;
		viewport.position.y = -windowHeight/2+PLAYER0_POSITION.y;
		p2p.createOffer();
	}
}