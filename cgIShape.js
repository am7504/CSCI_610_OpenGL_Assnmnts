class cgIShape {
    constructor () {
        this.points = [];
        this.bary = [];
        this.indices = [];
    }
    
    addTriangle (x0,y0,z0,x1,y1,z1,x2,y2,z2) {
        var nverts = this.points.length / 4;
        
        // push first vertex
        this.points.push(x0);  this.bary.push (1.0);
        this.points.push(y0);  this.bary.push (0.0);
        this.points.push(z0);  this.bary.push (0.0);
        this.points.push(1.0);
        this.indices.push(nverts);
        nverts++;
        
        // push second vertex
        this.points.push(x1); this.bary.push (0.0);
        this.points.push(y1); this.bary.push (1.0);
        this.points.push(z1); this.bary.push (0.0);
        this.points.push(1.0);
        this.indices.push(nverts);
        nverts++
        
        // push third vertex
        this.points.push(x2); this.bary.push (0.0);
        this.points.push(y2); this.bary.push (0.0);
        this.points.push(z2); this.bary.push (1.0);
        this.points.push(1.0);
        this.indices.push(nverts);
        nverts++;
    }
}

class Cube extends cgIShape {
    
    constructor (subdivisions) {
        super();
        this.makeCube (subdivisions);
    }
    
    makeCube (subdivisions)  {
        subdivisions -= 1;
        const squareWidth = 1 / (2 ** subdivisions); // Size of each small square
        const half = 0.5; // Cube goes from -0.5 to 0.5

        function createFace(normal, uAxis, vAxis, offset) {
            for (let i = 0; i < 2 ** subdivisions; i++) {
                for (let j = 0; j < 2 ** subdivisions; j++) {
                    // Compute four corners of the square
                    const reverse = offset < 0;
                    let x1 = -half + i * squareWidth;
                    let y1 = -half + j * squareWidth;
                    let x2 = x1 + squareWidth;
                    let y2 = y1 + squareWidth;

                    // Convert to 3D positions
                    let p1 = { [uAxis]: x1, [vAxis]: y1, [normal]: offset };
                    let p2 = { [uAxis]: x2, [vAxis]: y1, [normal]: offset };
                    let p3 = { [uAxis]: x1, [vAxis]: y2, [normal]: offset };
                    let p4 = { [uAxis]: x2, [vAxis]: y2, [normal]: offset };

                    // Two triangles per square
                    if (reverse) {
                        addTriangle(p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
                        addTriangle(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
                    } else {
                        addTriangle(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
                        addTriangle(p2.x, p2.y, p2.z, p4.x, p4.y, p4.z, p3.x, p3.y, p3.z);
                    }
                }
            }
        }

        // Generate faces (normal axis, u-axis, v-axis, normal offset)
        createFace("z", "y", "x", half);  // Front (+Z)
        createFace("z", "y", "x", -half); // Back (-Z)
        createFace("x", "z", "y", half);  // Right (+X)
        createFace("x", "z", "y", -half); // Left (-X)
        createFace("y", "x", "z", -half);  // Top (-Y)
        createFace("y", "x", "z", half); // Bottom (+Y)
    }
}


class Cylinder extends cgIShape {

    constructor (radialdivision,heightdivision) {
        super();
        this.makeCylinder (radialdivision,heightdivision);
    }
    
    makeCylinder (radialdivision,heightdivision){
        // fill in your cylinder code here
    }
}

class Cone extends cgIShape {

    constructor (radialdivision, heightdivision) {
        super();
        this.makeCone (radialdivision, heightdivision);
    }
    
    
    makeCone (radialdivision, heightdivision) {
    
        // Fill in your cone code here.
    }
}
    
class Sphere extends cgIShape {

    constructor (slices, stacks) {
        super();
        this.makeSphere (slices, stacks);
    }
    
    makeSphere (slices, stacks) {
        // fill in your sphere code here
    }

}


function radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

