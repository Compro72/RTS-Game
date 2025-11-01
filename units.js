class Unit {
    constructor(id, target, position, collisionRadius, maxSpeed) {
        // Physics variables
        this.position = position;
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.collisionRadius = collisionRadius;
        this.maxSpeed = maxSpeed;
        this.displayDir = createVector(1, 0)
        
        // Gameplay variables
        this.id = id;
        this.selected = false;
        this.health = 1;
        this.target = target;
        this.attackTarget = null;
        this.framesSinceLastProjectile = random(0, 100);
    }

    // Since a class cannot be transfered directly as JSON, the important data is encoded into an array
    getEncodedData() {
        return [this.id, [this.position.x, this.position.y], this.collisionRadius, [this.displayDir.x, this.displayDir.y]];
    }

    // Reduce health if hit by projectile
    projectileDamage(projectilePosition) {
        // AOE damage for is 50 radius around projectile position
        if (dist(this.position.x, this.position.y, projectilePosition.x, projectilePosition.y)<=this.collisionRadius+50) {
            this.health -= 0.1
        }
    }

    // Update the unit movement
    updatePhysics(allUnits) {
        let targetForce;
        if (this.attackTarget==null) {
            targetForce = getTargetForce(this.position, this.target, this.maxSpeed, this.velocity);
        } else {
            targetForce = getTargetForce(this.position, this.attackTarget.position, this.maxSpeed, this.velocity);
        }
        let avoidForce = getAvoidForce(this.position, this.collisionRadius, allUnits);

        let totalForce = p5.Vector.add(targetForce, avoidForce);
        
        this.acceleration.add(totalForce);

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
    }

    update(allUnits, viewport, projectileList) {
        this.updatePhysics(allUnits);

        // If attack target is destroyed set it to null
        if (!allUnits.includes(this.attackTarget)) {
            this.attackTarget = null;
        }

        // Shoot projectile at attack target if in range
        if (this.framesSinceLastProjectile>=100 && this.attackTarget!=null && dist(this.attackTarget.position.x, this.attackTarget.position.y, this.position.x, this.position.y)<500) {
            projectileList.push(new Projectile(this.position, this.attackTarget));
            this.framesSinceLastProjectile = 0;
        } else {
            this.framesSinceLastProjectile += 1
        }
        
        // Drawing the unit
        let posX = this.position.x-viewport.position.x;
        let posY = this.position.y-viewport.position.y;
        
        if (this.selected) {
            // Selection outline
            stroke(255);
            strokeWeight(2);
            line(posX-2*this.collisionRadius, posY-2*this.collisionRadius, posX-this.collisionRadius, posY-2*this.collisionRadius);
            line(posX-2*this.collisionRadius, posY-2*this.collisionRadius, posX-2*this.collisionRadius, posY-this.collisionRadius);
            line(posX+2*this.collisionRadius, posY-2*this.collisionRadius, posX+this.collisionRadius, posY-2*this.collisionRadius);
            line(posX+2*this.collisionRadius, posY-2*this.collisionRadius, posX+2*this.collisionRadius, posY-this.collisionRadius);
            line(posX-2*this.collisionRadius, posY+2*this.collisionRadius, posX-this.collisionRadius, posY+2*this.collisionRadius);
            line(posX-2*this.collisionRadius, posY+2*this.collisionRadius, posX-2*this.collisionRadius, posY+this.collisionRadius);
            line(posX+2*this.collisionRadius, posY+2*this.collisionRadius, posX+this.collisionRadius, posY+2*this.collisionRadius);
            line(posX+2*this.collisionRadius, posY+2*this.collisionRadius, posX+2*this.collisionRadius, posY+this.collisionRadius);
            
            // Health bar black background
            stroke(0);
            strokeWeight(8);
            line(posX-2*this.collisionRadius, posY-3*this.collisionRadius, posX+2*this.collisionRadius, posY-3*this.collisionRadius);
            
            // Coloured health bar
            colorMode(HSL, 100);
            stroke(max(0, min(this.health, 1))*33, 100, 50);
            colorMode(RGB);
            strokeWeight(4);
            line(posX-2*this.collisionRadius, posY-3*this.collisionRadius, (posX-2*this.collisionRadius)+4*this.collisionRadius*max(0, min(this.health, 1)), posY-3*this.collisionRadius);
        }

        // Draw white unit outline
        stroke(255);
        strokeWeight(this.collisionRadius*2+4);
        point(posX, posY);

        // Draw team colour unit
        if (localSide==0) {
            stroke(0, 0, 255);
        } else {
            stroke(255, 0, 0);
        }
        strokeWeight(this.collisionRadius*2);
        point(posX, posY);

        // Point towards attack target if exists, else point towards movement direction
        if (this.attackTarget!=null) {
            this.displayDir = p5.Vector.sub(this.attackTarget.position, this.position)
        } else if (this.velocity.mag()>0.01) {
            this.displayDir = createVector(this.velocity.x, this.velocity.y);
        }

        // Draw the line indicating direction
        stroke(255);
        strokeWeight(2);
        line(posX, posY, posX+this.displayDir.normalize().mult(this.collisionRadius+5).x, posY+this.displayDir.normalize().mult(this.collisionRadius+5).y);
    }
}


// Only stores the data needed for drawing and detecting hover on remote units
class RemoteUnit {
    constructor(data) {
        this.decodeData(data);
    }
    
    // Data from other peer's "getEncodedData" function is loaded here
    decodeData(data) {
        this.id = data[0];
        this.position = createVector(...data[1]);
        this.collisionRadius = data[2];
        this.displayDir = createVector(...data[3]);
    }
    
    // Point to circle collision
    isHovered(viewport) {
        let mousePos = viewport.screenToWorld(mouseX, mouseY);
        return dist(mousePos.x, mousePos.y, this.position.x, this.position.y)<=this.collisionRadius*2;
    }

    render(viewport) {
        let posX = this.position.x-viewport.position.x;
        let posY = this.position.y-viewport.position.y;

        // Draw white unit outline
        stroke(255);
        strokeWeight(this.collisionRadius*2+4);
        point(posX, posY);

        // Draw team colour unit
        if (localSide==1) {
            stroke(0, 0, 255);
        } else {
            stroke(255, 0, 0);
        }
        strokeWeight(this.collisionRadius*2);
        point(posX, posY);
        
        // Draw the line indicating direction
        stroke(255);
        strokeWeight(2);
        line(posX, posY, posX+this.displayDir.normalize().mult(this.collisionRadius+5).x, posY+this.displayDir.normalize().mult(this.collisionRadius+5).y);
    }
}


// Calculates avoidance force given a position, collision radius, and list of other units
function getAvoidForce(position, collisionRadius, otherUnits) {
	let force = createVector(0, 0);

	for (let other of otherUnits) {
		let vectorToOther = p5.Vector.sub(other.position, position);
		let dist = vectorToOther.mag();
		let minSeparation = collisionRadius+other.collisionRadius;
		let avoidanceDist = minSeparation*10;

        // Check if within avoidance range
		if (dist > 0 && dist < avoidanceDist) {
			let direction = vectorToOther.copy().normalize();
			let repulsionMagnitude;

			if (dist < minSeparation) {
                // Immediate strong repulsion if overlapping
				repulsionMagnitude = 1000;
			} else {
                // Ease-out repulsion when within avoidance range
				let ratio = (avoidanceDist-dist)/(avoidanceDist-minSeparation);
				repulsionMagnitude = ratio*ratio*10;
			}

            // Repulsion force applied in opposite direction
			let repulsion = direction.mult(-repulsionMagnitude);
			force.add(repulsion);
		}
	}

	return force;
}

// Calculates target force given position, target, max speed, and current velocity
function getTargetForce(position, target, maxSpeed, velocity) {
	let desired = p5.Vector.sub(target, position);
	let distance = desired.mag();

	let speed = maxSpeed;

    // Slow down when within 500 pixels of target
	if (distance<=500) {
		speed = (distance/500)*maxSpeed;
	}

    // Set desired velocity towards target
	desired.setMag(speed)
	let targetForce = p5.Vector.sub(desired, velocity);

	return targetForce;
}

// Check if a position is within a selection box defined by start and end points
function inSelectionBox(start, end, position) {
	let minX = min(start.x, end.x)
	let maxX = max(start.x, end.x)
	let minY = min(start.y, end.y)
	let maxY = max(start.y, end.y)

	if (position.x>=minX && position.x<=maxX && position.y>=minY && position.y<=maxY) {
		return true
	}
	return false
}