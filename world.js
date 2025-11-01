class World {
	constructor() {
		this.mainViewport = null;

		// [units, projectiles, structure]
		this.encodedData = [[], [], null];

		// Storing units data structure:
		// Uses Objects instead of Arrays for easier access by ID.
		// Once a unit is destroyed, another unit with the same ID will not be created again.
		// Using normal arrays would create unnecessary holes in the array to account for destroyed units.
		// for (let unitId in this.localData.units) { ... } can be used to loop through all unit IDs.

		// Contains local units, selected units, and projectiles. Actual physics and damage calculations are done on localData.
		this.localData = {
			units: {},
			selected: {},
			projectiles: []
		}

		// Contains remote units and projectiles. Used for rendering only except for RemoteUnit references passed into projectiles as targets.
		this.remoteData = {
			units: {},
			projectiles: []
		}

		// To get next unique ID
		this.nextUnitIndex = 0;

		// Structures
		this.localStructure = new Structure(this);
		this.remoteStructure = new RemoteStructure([[PLAYER1_POSITION.x, PLAYER1_POSITION.y], 175, 0.5]);
	}

	// Add a new unit to localData.units
	addUnit(unit) {
		this.localData.units[unit.id] = unit
		this.nextUnitIndex += 1;
	}

	// Add a new projectile to localData.projectiles
	addProjectile(projectile) {
		this.localData.projectiles.push(projectile)
	}

	// Attach main viewport for world
	attachViewport(viewport) {
		this.mainViewport = viewport;
	}
	
	// Decode data received from other peer and update remoteData
	decodeRemoteData(data) {
		// Read data
		let parsed = JSON.parse(data);
		let unitData = parsed[0];
		let projectileData = parsed[1];
		let structureData = parsed[2];

		// Update unit data
		let newRemoteUnitData = {}
		unitData.forEach(data => {
			// If unit already exists, just update its data. This is important to keep references intact for projectiles targeting RemoteUnits.
			if (this.remoteData.units.hasOwnProperty(data[0])) {
				newRemoteUnitData[data[0]] = this.remoteData.units[data[0]]
				newRemoteUnitData[data[0]].decodeData(data)
			} else {
				newRemoteUnitData[data[0]] = new RemoteUnit(data);
			}
		});
		this.remoteData.units = newRemoteUnitData;

		// Update projectile data
		this.remoteData.projectiles = []
		projectileData.forEach(data => {
			this.remoteData.projectiles.push(new RemoteProjectile(data))
		});

		// Update structure data
		this.remoteStructure.decodeData(structureData);
	}
	
	// Update encodedData with local unit data for sending to other peer
	setLocalUnitData() {
		this.encodedData[0] = []
		for (let unitId in this.localData.units) {
			this.encodedData[0].push(this.localData.units[unitId].getEncodedData())
		}
	}
	
	// Update encodedData with local projectile data for sending to other peer
	setLocalProjectileData() {
		this.encodedData[1] = []
		this.localData.projectiles.forEach(projectile => {
			this.encodedData[1].push(projectile.getEncodedData())
		});
	}

	// Select units within selection box
	select(start, end) {
		this.localData.selected = {}
		for (let unitId in this.localData.units) {
			let unit = this.localData.units[unitId]
			unit.selected = false;
			if (inSelectionBox(start, end, unit.position)) {
				this.localData.selected[unitId] = unit;
				unit.selected = true
			}
		}
	}

	// Select all units
	selectAll() {
		this.localData.selected = {}
		for (let unitId in this.localData.units) {
			let unit = this.localData.units[unitId]
			unit.selected = true
			this.localData.selected[unitId] = unit;
		}
	}

	// Unselect all units
	unselect() {
		for (let unitId in this.localData.selected) {
			let unit = this.localData.selected[unitId]
			unit.selected = false;
		}
		this.localData.selected = {}
	}

	// Scatter selected units (move them slightly forward from current position)
	spreadUnits() {
		for (let unitId in this.localData.selected) {
			let unit = this.localData.selected[unitId]
			unit.target = p5.Vector.add(unit.position, unit.displayDir.normalize().mult(100));
		}
	}

	// Get attack target based on current mouse position and viewport
	getAttackTarget() {
		let attackTarget = null;
		// Check structure first
		if (this.remoteStructure.isHovered(this.mainViewport)) {
			return this.remoteStructure;
		}
		// Then check units
		for (let unitId in this.remoteData.units) {
				if (this.remoteData.units[unitId].isHovered(this.mainViewport)) {
					attackTarget = this.remoteData.units[unitId];
				}
		}
		return attackTarget
	}

	update() {
		// Update viewport movement
		this.mainViewport.update();

		// Start rendering
		background(0);
		
		// Background grid
		let backGridSize = 300;

		// Green grid lines
		stroke(0, 89, 60)
		strokeWeight(4)
		for (let i = 0; i<ceil(windowHeight/backGridSize)+1; i++) {
			line(0, i*backGridSize-this.mainViewport.position.y%backGridSize, windowWidth, i*backGridSize-this.mainViewport.position.y%backGridSize)
		}
		for (let i = 0; i<ceil(windowWidth/backGridSize)+1; i++) {
			line(i*backGridSize-this.mainViewport.position.x%backGridSize, 0, i*backGridSize-this.mainViewport.position.x%backGridSize, windowHeight)
		}

		// Thick translucent grey lines
		stroke(40, 40, 40, 200)
		strokeWeight(40)
		for (let i = 0; i<ceil(windowHeight/backGridSize)+1; i++) {
			line(0, i*backGridSize-this.mainViewport.position.y%backGridSize-backGridSize/2, windowWidth, i*backGridSize-this.mainViewport.position.y%backGridSize-backGridSize/2)
		}
		for (let i = 0; i<ceil(windowWidth/backGridSize)+1; i++) {
			line(i*backGridSize-this.mainViewport.position.x%backGridSize-backGridSize/2, 0, i*backGridSize-this.mainViewport.position.x%backGridSize-backGridSize/2, windowHeight)
		}
		this.localStructure.update(viewport);
		this.remoteStructure.update(viewport);

		// Combine all units and structures that will be used for physics calculations for units
		let allUnits = [...Object.values(this.localData.units), ...Object.values(this.remoteData.units), this.localStructure, this.remoteStructure];
		
		// Update local units
		for (let unitId in this.localData.units) {
			this.localData.units[unitId].update(allUnits, this.mainViewport, world.localData.projectiles)
		}

		// Render remote units
		for (let unitId in this.remoteData.units) {
			this.remoteData.units[unitId].render(this.mainViewport)
		}

		// Render remote projectiles and apply AOE damage for dead projectiles.
		this.remoteData.projectiles.forEach(remoteProjectile => {
			remoteProjectile.render(this.mainViewport)
			
			if (!remoteProjectile.alive) {
				for (let unitId in this.localData.units) {
					this.localData.units[unitId].projectileDamage(remoteProjectile.position);
				}
				this.localStructure.projectileDamage(remoteProjectile.position);
			}
		});

		// Encode local projectile data. Important to do this before cleaning up dead projectiles so that peer can know which projectiles are dead.
		this.setLocalProjectileData()
		
		this.localData.projectiles = this.localData.projectiles.filter(projectile => projectile.alive==true);
		this.localData.projectiles.forEach(projectile => {
			projectile.update(this.mainViewport)
		});
		
		// Encode local unit data
		this.setLocalUnitData()

		for (let unitId in this.localData.units) {
			if (this.localData.units[unitId].health<=0) {
				delete this.localData.units[unitId];
			}
		}

		// Encode local structure data
		this.encodedData[2] = this.localStructure.getEncodedData();

		// Check if any structure has been destroyed
		if (this.localStructure.health<=0 || this.remoteStructure.health<=0) {
			gameDone = true;
		}
	}

	// End screen
	endMessage() {
		connectionEstablished = false;
		background(0);
		textAlign(CENTER, CENTER);
		textSize(64);
		fill(255);
		noStroke();
		if (this.localStructure.health<=0) {
			text("You Lose!", width/2, height/2);
		} else if (this.remoteStructure.health<=0) {
			text("You Win!", width/2, height/2);
		}
	}
}