function goFullscreen() {
	//if (document.body.requestFullscreen) document.body.requestFullscreen();
}

function getAvoidForce(position, collisionRadius, otherUnits) {
	let force = createVector(0, 0);

	for (let other of otherUnits) {
		let vectorToOther = p5.Vector.sub(other.position, position);
		let dist = vectorToOther.mag();
		let minSeparation = collisionRadius+other.collisionRadius;
		let avoidanceDist = minSeparation*10;

		if (dist > 0 && dist < avoidanceDist) {
			let direction = vectorToOther.copy().normalize();
			let repulsionMagnitude;
			
			if (dist < minSeparation) {
				repulsionMagnitude = 1000;
			} else {
				let ratio = (avoidanceDist-dist)/(avoidanceDist-minSeparation);
				repulsionMagnitude = ratio*ratio*10;
			}
			
			let repulsion = direction.mult(-repulsionMagnitude);
			force.add(repulsion);
		}
	}

	return force;
}

function getTargetForce(position, target, maxSpeed, velocity) {
	let desired = p5.Vector.sub(target, position);
	let distance = desired.mag();

	let speed = maxSpeed;

	if (distance<=500) {
		speed = (distance/500)*maxSpeed;
	}

	desired.setMag(speed)
	let targetForce = p5.Vector.sub(desired, velocity);

	return targetForce;
}

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