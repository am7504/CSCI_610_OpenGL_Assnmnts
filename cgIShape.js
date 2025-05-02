class cgIShape {
    constructor () {
        this.points = [];    // 4 floats per vertex (x, y, z, w) - Ensure using the vec4 version!
        this.bary = [];      // 3 floats per vertex (Might not be used with texturing/lighting)
        this.indices = [];   // 3 ints per face
        this.normals=[];     // 3 floats per vertex
        this.uv = [];        // 2 floats per vertex
    }

    addTriangle (x0,y0,z0,x1,y1,z1,x2,y2,z2) {
        var nverts = this.points.length / 4; // Use 4 for vec4 points
        // push vertex 0 (x, y, z, w=1.0)
        this.points.push(x0); this.points.push(y0); this.points.push(z0); this.points.push(1.0);
        // this.bary.push (1.0); this.bary.push (0.0); this.bary.push (0.0); // Optional
        this.indices.push(nverts); nverts++;
        // push vertex 1 (x, y, z, w=1.0)
        this.points.push(x1); this.points.push(y1); this.points.push(z1); this.points.push(1.0);
        // this.bary.push (0.0); this.bary.push (1.0); this.bary.push (0.0); // Optional
        this.indices.push(nverts); nverts++;
        // push vertex 2 (x, y, z, w=1.0)
        this.points.push(x2); this.points.push(y2); this.points.push(z2); this.points.push(1.0);
        // this.bary.push (0.0); this.bary.push (0.0); this.bary.push (1.0); // Optional
        this.indices.push(nverts); nverts++;
    }

    addNormal (x0,y0,z0,x1,y1,z1,x2,y2,z2) {
        this.normals.push(x0); this.normals.push(y0); this.normals.push(z0);
        this.normals.push(x1); this.normals.push(y1); this.normals.push(z1);
        this.normals.push(x2); this.normals.push(y2); this.normals.push(z2);
    }

    adduv (u0, v0, u1, v1, u2, v2) {
        this.uv.push(u0); this.uv.push(v0);
        this.uv.push(u1); this.uv.push(v1);
        this.uv.push(u2); this.uv.push(v2);
    }
} // End cgIShape