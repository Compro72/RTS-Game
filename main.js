/**
Umar Ahmed
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
		---
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
	Comments on "Draw" commands
		---
	Comments on loops and ifs
		---
	Prompts / Ease of use
		Instructions to play and connect to other player are included on the start screen
		Game itself is intuitive
		Visual feedback within the game
	Header Done
*/


let startX = 0;
let startY = 0;

let mouseDown = false;

let world;
let viewport;
let p2p;
let localSide = null;
let connectionEstablished = false;
let gameDone = false;

function setupP2P() {
	p2p = new P2PDataChannel();

	p2p.onSignalGenerated = (signal) => {
		navigator.clipboard.writeText(signal);
		document.getElementById("shareCode").textContent = signal;
	}

	p2p.onDataReceived = (data) => {
		if (data=="1") {
			continueGame();
		} else {
			world.decodeRemoteData(data);
		}
	}
}


function setup() {
	createCanvas(windowWidth, windowHeight);
	initGame();
}

function initGame() {
	document.getElementById("continue").style.display = "none";
	viewport = new Viewport(0, 0);
	world = new World();
	world.attachViewport(viewport);

	if (localSide!=null) {
		if (localSide==0) {
			viewport.position.x = -windowWidth/2+PLAYER1_POSITION.x;
			viewport.position.y = -windowHeight/2+PLAYER1_POSITION.y;
		} else {
			viewport.position.x = -windowWidth/2+PLAYER2_POSITION.x;
			viewport.position.y = -windowHeight/2+PLAYER2_POSITION.y;
		}
	}
}

function continueGame() {
	initGame();
	connectionEstablished = true;
	gameDone = false;
	if (localSide==0) {
		p2p.sendData(1)
	}
}


function draw() {
	if (gameDone) {
		world.endMessage();
		if (localSide==0) {
			document.getElementById("continue").style.display = "block";
		}
		return;
	}
	if (p2p && p2p.dataChannel && p2p.dataChannel.readyState=="open") {
		connectionEstablished = true;
		document.getElementById("shareCode").style.display = "none";
		document.getElementById("instructions").style.display = "none";
	}
	if (connectionEstablished) {
		if (keyIsDown(83)) {
			world.spreadUnits();
		}

		world.update();

		noFill();
		stroke(255);
		strokeWeight(2);
		if (mouseDown) {
			rect(startX, startY, mouseX-startX, mouseY-startY);
		}
		p2p.sendData(world.encodedData);
	} else {
		background(0)
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

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
			world.unselect();
		}
	}
}

function mouseReleased() {
	if (gameDone) {
		return;
	}
	if (connectionEstablished) {
		if (mouseButton==LEFT) {
			if (abs(startX-mouseX)>2 || abs(startX-mouseX)>2) {
				world.select(viewport.screenToWorld(startX, startY), viewport.screenToWorld(mouseX, mouseY));
			} else {
				let attackTarget = world.getAttackTarget();
				
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

function keyPressed() {
	if (gameDone) {
		return;
	}
	if (connectionEstablished) {
		if (key==="a") {
			world.selectAll();
		}
		if (key==="h") {
			if (localSide==0) {
				viewport.position.x = -windowWidth/2+PLAYER1_POSITION.x;
				viewport.position.y = -windowHeight/2+PLAYER1_POSITION.y;
			} else {
				viewport.position.x = -windowWidth/2+PLAYER2_POSITION.x;
				viewport.position.y = -windowHeight/2+PLAYER2_POSITION.y;
			}
		}
		//if (key==="e") {
			//world.localStructure.health = 0;
		//}
	}
}



window.onload = () => {
	setupP2P();
	document.oncontextmenu = function() { return false; }

	let hash = window.location.hash;
	if (hash.startsWith("#offer=")) {
		localSide = 1;
		viewport.position.x = -windowWidth/2+PLAYER2_POSITION.x;
		viewport.position.y = -windowHeight/2+PLAYER2_POSITION.y;

		let encodedSignal = hash.substring("#offer=".length);
		decoded = decodeURIComponent(encodedSignal);
		p2p.process(decodeURIComponent(encodedSignal));
	} else {
		localSide = 0;
		viewport.position.x = -windowWidth/2+PLAYER1_POSITION.x;
		viewport.position.y = -windowHeight/2+PLAYER1_POSITION.y;
		p2p.createOffer();
	}
}