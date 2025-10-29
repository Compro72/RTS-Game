class Projectile {
    constructor(position, target) {
        this.position = position.copy();
        this.target = target;
        this.velocity = p5.Vector.sub(this.target.position, this.position);
        this.framesDone = 0;
        this.alive = true;
        this.size = 5;
    }
    
    getEncodedData() {
        return [[this.position.x, this.position.y], this.size, this.alive];
    }

    update(viewport) {
        this.velocity = p5.Vector.sub(this.target.position, this.position).normalize().mult(20);
        if (dist(this.position.x, this.position.y, this.target.position.x, this.target.position.y)>this.velocity.mag()/2 && this.size<=5) {
            this.position.add(this.velocity)

            if (this.framesDone==100) {
                this.size += 5
            }
        } else {
            if (this.size>50) {
                this.alive = false;
            } else {
                this.size += 5
            }
        }
        if (this.size>5) {
            noFill()
            stroke(255, 85, 0)
            strokeWeight(5)
            circle(this.position.x-viewport.position.x, this.position.y-viewport.position.y, this.size)
            stroke(255, 155, 105)
            strokeWeight(this.size/2)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
            stroke(255, 200, 200)
            strokeWeight(this.size/4)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        } else {
            stroke(255, 0, 0)
            strokeWeight(this.size)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        }

        this.framesDone += 1
    }
}



class RemoteProjectile {
    constructor(data) {
        this.position = createVector(data[0][0], data[0][1]);
        this.size = data[1];
        this.alive = data[2];
    }
    
    render(viewport) {
        if (this.size>5) {
            noFill()
            stroke(255, 85, 0)
            strokeWeight(5)
            circle(this.position.x-viewport.position.x, this.position.y-viewport.position.y, this.size)
            stroke(255, 155, 105)
            strokeWeight(this.size/2)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
            stroke(255, 200, 200)
            strokeWeight(this.size/4)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        } else {
            stroke(255, 0, 0)
            strokeWeight(this.size)
            point(this.position.x-viewport.position.x, this.position.y-viewport.position.y)
        }
    }
}