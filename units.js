class Unit {
    constructor(id, target, position, collisionRadius, maxSpeed) {
        this.id = id;
        this.target = target;
        this.attackTarget = null;

        this.position = position;
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);

        this.collisionRadius = collisionRadius;
        this.maxSpeed = maxSpeed;
        this.displayDir = createVector(0, 0)
        
        this.selected = false;
        this.health = 1;
        this.framesSinceLastProjectile = random(0, 100);
    }

    getEncodedData() {
        return [this.id, [this.position.x, this.position.y], this.collisionRadius, [this.displayDir.x, this.displayDir.y]];
    }
    
    generateProjectile(projectileList) {
        projectileList.push(new Projectile(this.position, this.attackTarget));
    }

    projectileDamage(projectilePosition) {
        if (dist(this.position.x, this.position.y, projectilePosition.x, projectilePosition.y)<=this.collisionRadius+50) {
            this.health -= 0.07
        }
    }

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
        if (!allUnits.includes(this.attackTarget)) {
            this.attackTarget = null;
        }
        if (this.framesSinceLastProjectile>=100 && this.attackTarget!=null && dist(this.attackTarget.position.x, this.attackTarget.position.y, this.position.x, this.position.y)<300) {
            this.generateProjectile(projectileList);
            this.framesSinceLastProjectile = 0;
        } else {
            this.framesSinceLastProjectile += 1
        }
        
        this.updatePhysics(allUnits);
                
        let posX = this.position.x-viewport.position.x;
        let posY = this.position.y-viewport.position.y;

        // Draw
        strokeWeight(2);
        stroke(255);
        noFill();
        if (this.selected) {
            line(posX-2*this.collisionRadius, posY-2*this.collisionRadius, posX-this.collisionRadius, posY-2*this.collisionRadius);
            line(posX-2*this.collisionRadius, posY-2*this.collisionRadius, posX-2*this.collisionRadius, posY-this.collisionRadius);
            line(posX+2*this.collisionRadius, posY-2*this.collisionRadius, posX+this.collisionRadius, posY-2*this.collisionRadius);
            line(posX+2*this.collisionRadius, posY-2*this.collisionRadius, posX+2*this.collisionRadius, posY-this.collisionRadius);
            line(posX-2*this.collisionRadius, posY+2*this.collisionRadius, posX-this.collisionRadius, posY+2*this.collisionRadius);
            line(posX-2*this.collisionRadius, posY+2*this.collisionRadius, posX-2*this.collisionRadius, posY+this.collisionRadius);
            line(posX+2*this.collisionRadius, posY+2*this.collisionRadius, posX+this.collisionRadius, posY+2*this.collisionRadius);
            line(posX+2*this.collisionRadius, posY+2*this.collisionRadius, posX+2*this.collisionRadius, posY+this.collisionRadius);
            
            stroke(0);
            strokeWeight(8);
            line(posX-2*this.collisionRadius, posY-3*this.collisionRadius, posX+2*this.collisionRadius, posY-3*this.collisionRadius);
            
            colorMode(HSL, 100);
            stroke(max(0, min(this.health, 1))*33, 100, 50);
            colorMode(RGB);
            strokeWeight(4);
            line(posX-2*this.collisionRadius, posY-3*this.collisionRadius, (posX-2*this.collisionRadius)+4*this.collisionRadius*max(0, min(this.health, 1)), posY-3*this.collisionRadius);
        }

        stroke(255);
        strokeWeight(this.collisionRadius*2+4);
        point(posX, posY);

        if (localSide==0) {
            stroke(0, 0, 255);
        } else {
            stroke(255, 0, 0);
        }
        strokeWeight(this.collisionRadius*2);
        point(posX, posY);

        
        stroke(255);
        strokeWeight(2);
        let temp = createVector(this.velocity.x, this.velocity.y);
        if (this.attackTarget!=null) {
            this.displayDir = p5.Vector.sub(this.attackTarget.position, this.position)
        } else if (temp.mag()>0.01) {
            this.displayDir = createVector(this.velocity.x, this.velocity.y);
        }
        line(posX, posY, posX+this.displayDir.normalize().mult(this.collisionRadius+5).x, posY+this.displayDir.normalize().mult(this.collisionRadius+5).y);
    }
}

class RemoteUnit {
    constructor(data) {
        this.decodeData(data);
    }
    
    decodeData(data) {
        this.id = data[0];
        this.position = createVector(...data[1]);
        this.collisionRadius = data[2];
        this.displayDir = createVector(...data[3]);
    }
    
    isHovered(viewport) {
        let mousePos = viewport.screenToWorld(mouseX, mouseY);
        return dist(mousePos.x, mousePos.y, this.position.x, this.position.y)<=this.collisionRadius*3/2;
    }

    render(viewport) {
        let posX = this.position.x-viewport.position.x;
        let posY = this.position.y-viewport.position.y;

        stroke(255);
        strokeWeight(this.collisionRadius*2+4);
        point(posX, posY);

        if (localSide==1) {
            stroke(0, 0, 255);
        } else {
            stroke(255, 0, 0);
        }
        strokeWeight(this.collisionRadius*2);
        point(posX, posY);
        
        stroke(255);
        strokeWeight(2);
        line(posX, posY, posX+this.displayDir.normalize().mult(this.collisionRadius+5).x, posY+this.displayDir.normalize().mult(this.collisionRadius+5).y);
    }
}