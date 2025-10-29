class World {
	constructor(sizeX, sizeY) {
		this.size = createVector(sizeX, sizeY);
		this.mainViewport = null;

		this.encodedData = [[], []]

		this.localData = {
			units: {},
			selected: {},
			projectiles: []
		}

		this.remoteData = {
			units: {},
			projectiles: []
		}

		this.nextUnitIndex = 0;
	}

	addUnit(unit) {
		this.localData.units[unit.id] = unit
		this.nextUnitIndex += 1;
	}

	addProjectile(projectile) {
		this.localData.projectiles.push(projectile)
	}

	attachViewport(viewport) {
		this.mainViewport = viewport;
	}
	
	decodeRemoteData(data) {
		let parsed = JSON.parse(data);
		let unitData = parsed[0];
		let projectileData = parsed[1];
		let newRemoteData = {}
		
		unitData.forEach(data => {
			if (this.remoteData.units.hasOwnProperty(data[0])) {
				newRemoteData[data[0]] = this.remoteData.units[data[0]]
				newRemoteData[data[0]].decodeData(data)
			} else {
				newRemoteData[data[0]] = new RemoteUnit(data);
			}
		});

		this.remoteData.units = newRemoteData;

		this.remoteData.projectiles = []
		projectileData.forEach(data => {
			this.remoteData.projectiles.push(new RemoteProjectile(data))
		});
	}
	
	setLocalUnitData() {
		this.encodedData[0] = []
		for (let unitId in this.localData.units) {
			this.encodedData[0].push(this.localData.units[unitId].getEncodedData())
		}
	}
	
	setLocalProjectileData() {
		this.encodedData[1] = []
		this.localData.projectiles.forEach(projectile => {
			this.encodedData[1].push(projectile.getEncodedData())
		});
	}

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

	selectAll() {
		this.localData.selected = {}
		for (let unitId in this.localData.units) {
			let unit = this.localData.units[unitId]
			unit.selected = true
			this.localData.selected[unitId] = unit;
		}
	}

	unselect() {
		for (let unitId in this.localData.selected) {
			let unit = this.localData.selected[unitId]
			unit.selected = false;
		}
		this.localData.selected = {}
	}

	spreadUnits() {
		for (let unitId in this.localData.selected) {
			let unit = this.localData.selected[unitId]
			unit.target = p5.Vector.add(unit.position, unit.displayDir.normalize().mult(100));
		}
	}

	getAttackTarget() {
		let attackTarget = null;
		for (let unitId in this.remoteData.units) {
				if (this.remoteData.units[unitId].isHovered(this.mainViewport)) {
					attackTarget = this.remoteData.units[unitId];
				}
		}
		return attackTarget
	}

	update() {
		this.mainViewport.update();

		background(0);
		stroke(0, 89, 60)
		strokeWeight(4)
		let backGridSize = 300;
		for (let i = 0; i<ceil(windowHeight/backGridSize)+1; i++) {
			line(0, i*backGridSize-this.mainViewport.position.y%backGridSize, windowWidth, i*backGridSize-this.mainViewport.position.y%backGridSize)
		}
		for (let i = 0; i<ceil(windowWidth/backGridSize)+1; i++) {
			line(i*backGridSize-this.mainViewport.position.x%backGridSize, 0, i*backGridSize-this.mainViewport.position.x%backGridSize, windowHeight)
		}

		stroke(40, 40, 40, 200)
		strokeWeight(40)
		for (let i = 0; i<ceil(windowHeight/backGridSize)+1; i++) {
			line(0, i*backGridSize-this.mainViewport.position.y%backGridSize-backGridSize/2, windowWidth, i*backGridSize-this.mainViewport.position.y%backGridSize-backGridSize/2)
		}
		for (let i = 0; i<ceil(windowWidth/backGridSize)+1; i++) {
			line(i*backGridSize-this.mainViewport.position.x%backGridSize-backGridSize/2, 0, i*backGridSize-this.mainViewport.position.x%backGridSize-backGridSize/2, windowHeight)
		}


		let allUnits = [...Object.values(this.localData.units), ...Object.values(this.remoteData.units)]
		for (let unitId in this.localData.units) {
			this.localData.units[unitId].update(allUnits, this.mainViewport, world.localData.projectiles)
		}


		for (let unitId in this.remoteData.units) {
			this.remoteData.units[unitId].render(this.mainViewport)
		}


		this.remoteData.projectiles.forEach(remoteProjectile => {
			remoteProjectile.render(this.mainViewport)
			
			if (!remoteProjectile.alive) {
				for (let unitId in this.localData.units) {
					this.localData.units[unitId].projectileDamage(remoteProjectile.position);
				}
			}
		});



		this.setLocalProjectileData()
		
		this.localData.projectiles = this.localData.projectiles.filter(projectile => projectile.alive==true);
		this.localData.projectiles.forEach(projectile => {
			projectile.update(this.mainViewport)
		});
		
		this.setLocalUnitData()

		for (let unitId in this.localData.units) {
			if (this.localData.units[unitId].health<=0) {
				delete this.localData.units[unitId];
			}
		}
	}
}