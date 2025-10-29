let startX = 0;
let startY = 0;
let viewportSpeed = 20;

let mouseDown = false;

let world;
let viewport;
let p2p;
let localSide;

function setupP2P() {
	p2p = new P2PDataChannel();

	p2p.onSignalGenerated = (signal) => {
		console.log(signal);
		navigator.clipboard.writeText(signal);
	}

	p2p.onDataReceived = (data) => {
		world.decodeRemoteData(data);
	}
}


function setup() {
	createCanvas(windowWidth, windowHeight);
	world = new World();
	viewport = new Viewport(0, 0);
	//viewport.restrict(0, 0);
	world.attachViewport(viewport);
	for (let i=0; i<50; i++) {
		world.addUnit(new Unit(world.nextUnitIndex, createVector(100, 100), createVector(100, 100), 15, 10));
	}
	//frameRate(10);
}


function draw() {
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
	if (p2p) {
		p2p.sendData(world.encodedData);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
	if (mouseButton==LEFT) {
		mouseDown = true;
		startX = mouseX;
		startY = mouseY;
	} else {
		world.unselect();
	}
}

function mouseReleased() {
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

function keyPressed() {
	if (key==="a") {
		world.selectAll();
	}
}



window.onload = () => {
	setupP2P();
	document.oncontextmenu = function() { return false; }

	let hash = window.location.hash;
	if (hash.startsWith("#offer=")) {
		localSide = 1;

		let encodedSignal = hash.substring("#offer=".length);
		decoded = decodeURIComponent(encodedSignal)
		p2p.process(decodeURIComponent(encodedSignal))
	} else {
		localSide = 0;
		p2p.createOffer()
	}
}