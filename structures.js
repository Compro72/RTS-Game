class Structure {
    constructor(world) {
        this.position = createVector(0, 0);
        this.unitCreationTimer = UNIT_CREATION_FRAMES;
        this.world = world;

        this.collisionRadius = 175;
        this.health = 1;
    }

    // Since a class cannot be transfered directly as JSON, the important data is encoded into an array.
    getEncodedData() {
        return [[this.position.x, this.position.y], this.collisionRadius, this.health, this.unitCreationTimer];
    }

    // Reduce health if hit by projectile
    projectileDamage(projectilePosition) {
        // AOE damage for is 50 radius around projectile position
        if (dist(this.position.x, this.position.y, projectilePosition.x, projectilePosition.y)<=this.collisionRadius+50) {
            this.health -= 0.003
        }
    }

    update(viewport) {
        // Position structure based on player side
        if (localSide==0) {
            this.position = createVector(PLAYER0_POSITION.x, PLAYER0_POSITION.y);
        } else {
            this.position = createVector(PLAYER1_POSITION.x, PLAYER1_POSITION.y);
        }

        // Create new unit every UNIT_CREATION_FRAMES
        if (this.unitCreationTimer==UNIT_CREATION_FRAMES+1) {
            this.world.addUnit(new Unit(this.world.nextUnitIndex, createVector(this.position.x, this.position.y+25), createVector(this.position.x+1, this.position.y+25), 15, 10))
            this.unitCreationTimer = 0
        }

        // Draw structure
        let posX = this.position.x-viewport.position.x;
        let posY = this.position.y-viewport.position.y;
        
        // Outer base circle
        stroke(50);
        strokeWeight(this.collisionRadius*2);
        point(posX, posY);
        
        // Structure outline. Custom shape.
        stroke(255);
        strokeWeight(5);
        if (localSide==0) {
            fill(0, 0, 255)
        } else {
            fill(255, 0, 0)
        }
        
        beginShape();
        vertex(posX-100, posY-100);
        vertex(posX+100, posY-100);
        vertex(posX+100, posY+100);
        vertex(posX+50, posY+100);
        vertex(posX+50, posY-50);
        vertex(posX-50, posY-50);
        vertex(posX-50, posY+100);
        vertex(posX-100, posY+100);
        vertex(posX-100, posY+-100);
        endShape();
        
        // Currently creating unit
        let transparency = map(this.unitCreationTimer, 0, UNIT_CREATION_FRAMES, 0, 255)
        stroke(255, 255, 255, transparency);
        strokeWeight(34);
        point(posX, posY+25);

        if (localSide==0) {
            stroke(0, 0, 255, transparency);
        } else {
            stroke(255, 0, 0, transparency);
        }
        strokeWeight(30);
        point(posX, posY+25);

        stroke(255, 255, 255, transparency);
        strokeWeight(2);
        line(posX, posY+25, posX+20, posY+25);

        // Health bar background
        stroke(0);
        strokeWeight(20);
        line(posX-this.collisionRadius-15, posY-this.collisionRadius-15, posX+this.collisionRadius+15, posY-this.collisionRadius-15);

        // Colour health bar
        colorMode(HSL, 100);
        stroke(max(0, min(this.health, 1))*33, 100, 50);
        colorMode(RGB);
        strokeWeight(15);
        line(posX-this.collisionRadius-15, posY-this.collisionRadius-15, posX-this.collisionRadius-15+(2*this.collisionRadius+30)*max(0, min(this.health, 1)), posY-this.collisionRadius-15);
        
        this.unitCreationTimer += 1;
    }
}

// Only stores the data needed for drawing and detecting hover on the remote structure
class RemoteStructure {
    constructor(data) {
        this.decodeData(data);
    }

    // Data from other peer's "Structure.getEncodedData" function is loaded here
    decodeData(data) {
        if (data.length==0) {
            return;
        }
        this.position = createVector(data[0][0], data[0][1]);
        this.collisionRadius = data[1];
        this.health = data[2];
        this.unitCreationTimer = data[3];
    }

    // Point to circle collision
    isHovered(viewport) {
        let mousePos = viewport.screenToWorld(mouseX, mouseY);
        return dist(mousePos.x, mousePos.y, this.position.x, this.position.y)<=this.collisionRadius;
    }

    update(viewport) {
        // Draw structure
        let posX = this.position.x-viewport.position.x;
        let posY = this.position.y-viewport.position.y;
        
        // Outer base circle
        stroke(50);
        strokeWeight(this.collisionRadius*2);
        point(posX, posY);
        
        // Structure outline. Custom shape.
        stroke(255);
        strokeWeight(5);
        if (localSide==1) {
            fill(0, 0, 255)
        } else {
            fill(255, 0, 0)
        }
        
        beginShape();
        vertex(posX-100, posY-100);
        vertex(posX+100, posY-100);
        vertex(posX+100, posY+100);
        vertex(posX+50, posY+100);
        vertex(posX+50, posY-50);
        vertex(posX-50, posY-50);
        vertex(posX-50, posY+100);
        vertex(posX-100, posY+100);
        vertex(posX-100, posY+-100);
        endShape();
        
        // Currently creating unit
        let transparency = map(this.unitCreationTimer, 0, UNIT_CREATION_FRAMES, 0, 255)
        stroke(255, 255, 255, transparency);
        strokeWeight(34);
        point(posX, posY+25);

        if (localSide==1) {
            stroke(0, 0, 255, transparency);
        } else {
            stroke(255, 0, 0, transparency);
        }
        strokeWeight(30);
        point(posX, posY+25);
        
        stroke(255, 255, 255, transparency);
        strokeWeight(2);
        line(posX, posY+25, posX+20, posY+25);

        // Health bar background
        stroke(0);
        strokeWeight(20);
        line(posX-this.collisionRadius-15, posY-this.collisionRadius-15, posX+this.collisionRadius+15, posY-this.collisionRadius-15);

        // Colour health bar
        colorMode(HSL, 100);
        stroke(max(0, min(this.health, 1))*33, 100, 50);
        colorMode(RGB);
        strokeWeight(15);
        line(posX-this.collisionRadius-15, posY-this.collisionRadius-15, posX-this.collisionRadius-15+(2*this.collisionRadius+30)*max(0, min(this.health, 1)), posY-this.collisionRadius-15);
    }
}