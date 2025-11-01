class Projectile {
    constructor(position, target) {
        this.position = position.copy();
        this.target = target; // This is a RemoteUnit or RemoteStructure reference
        this.velocity = p5.Vector.sub(this.target.position, this.position);
        this.framesDone = 0;
        this.alive = true;
        this.size = 5;
    }
    
    // Since a class cannot be transfered directly as JSON, the important data is encoded into an array
    getEncodedData() {
        return [[this.position.x, this.position.y], this.size, this.alive];
    }

    update(viewport) {
        // Velocity always points towards target's current position (Homing projectile).
        this.velocity = p5.Vector.sub(this.target.position, this.position).normalize().mult(20);

        // Check if projectile hit target yet or is already in the exploding state
        // Moving projectile state when this.size<=5
        // Exploding state when this.size>5
        if (dist(this.position.x, this.position.y, this.target.position.x, this.target.position.y)>this.velocity.mag()/2 && this.size<=5) {
            // Move towards target
            this.position.add(this.velocity)

            // Explode if 100 frames have passed without hitting target
            if (this.framesDone==100) {
                this.size += 5
            }
        } else {
            // Max size for explosion > 50
            if (this.size>50) {
                this.alive = false;
            } else {
                this.size += 5
            }
        }
        if (this.size>5) {
            // Exploding projectile drawing
            // Outer orange circle outline
            noFill()
            stroke(255, 85, 0)
            strokeWeight(5)
            circle(this.position.x-viewport.position.x, this.position.y-viewport.position.y, this.size)

            // Middle orange dot
            stroke(255, 155, 105)
            strokeWeight(this.size/2)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)

            // Inner light orange dot
            stroke(255, 200, 200)
            strokeWeight(this.size/4)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        } else {
            // Moving projectile drawing (red dot)
            stroke(255, 0, 0)
            strokeWeight(this.size)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        }

        this.framesDone += 1
    }
}


// Only stores the data needed for rendering remote projectiles
class RemoteProjectile {
    constructor(data) {
        this.position = createVector(data[0][0], data[0][1]);
        this.size = data[1];
        this.alive = data[2];
    }
    
    render(viewport) {
        if (this.size>5) {
            // Exploding projectile drawing
            // Outer orange circle outline
            noFill()
            stroke(255, 85, 0)
            strokeWeight(5)
            circle(this.position.x-viewport.position.x, this.position.y-viewport.position.y, this.size)

            // Middle orange dot
            stroke(255, 155, 105)
            strokeWeight(this.size/2)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)

            // Inner light orange dot
            stroke(255, 200, 200)
            strokeWeight(this.size/4)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        } else {
            // Moving projectile drawing (red dot)
            stroke(255, 0, 0)
            strokeWeight(this.size)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        }
    }
}