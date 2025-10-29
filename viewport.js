class Viewport {
	constructor(positionX, positionY) {
		this.position = createVector(positionX, positionY);
		this.velocity = createVector(0, 0);
		this.acceleration = createVector(0, 0);
		this.resistance = 0.2;
		this.maxAcceleration = 4;
		this.minX = null;
		this.minY = null;
		this.maxX = null;
		this.maxY = null;
	}

	restrict(minX, minY, maxX, maxY) {
		this.minX = minX;
		this.minY = minY;
		this.maxX = maxX;
		this.maxY = maxY;
	}

	screenToWorld(screenX, screenY) {
		return createVector(this.position.x+screenX, this.position.y+screenY)
	}

	update() {
		this.acceleration = createVector(keyIsDown(39)-keyIsDown(37), keyIsDown(40)-keyIsDown(38)).normalize().mult(this.maxAcceleration)
		this.velocity.mult(1-this.resistance);
		this.velocity.add(this.acceleration)

		this.position.add(this.velocity);
		
		if (this.minX!=null) {
			this.position.x = max(this.position.x, this.minX);
		}
		if (this.minY!=null) {
			this.position.y = max(this.position.y, this.minY);
		}
		if (this.maxX!=null) {
			this.position.x = min(this.position.x, this.maxX);
		}
		if (this.maxY!=null) {
			this.position.y = min(this.position.y, this.maxY);
		}
	}
}