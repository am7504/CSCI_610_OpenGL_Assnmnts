class Cube extends cgIShape {
    constructor(partType) { // Constructor takes partType key (e.g., "head_boy")
        super();
        // Subdivision is implicitly 1 for this approach
        this.partType = partType;
        this.makeCube();
    }

    makeCube() {
        // Define the 8 vertices of a unit cube centered at origin
        const s = 0.5;
        const vertices = [
            [-s, -s, +s], [+s, -s, +s], [+s, +s, +s], [-s, +s, +s], // Front face: v0, v1, v2, v3
            [+s, -s, -s], [-s, -s, -s], [-s, +s, -s], [+s, +s, -s], // Back face: v4, v5, v6, v7
        ];
        const v0 = vertices[0], v1 = vertices[1], v2 = vertices[2], v3 = vertices[3];
        const v4 = vertices[4], v5 = vertices[5], v6 = vertices[6], v7 = vertices[7];

        // --- Get the pre-calculated UV coordinates ---
        if (!precalculatedUVs || !precalculatedUVs[this.partType] || !precalculatedUVs[this.partType].coordinates) {
            console.error("Could not find pre-calculated UV coordinates for partType:", this.partType);
            return;
        }
        const coords = precalculatedUVs[this.partType].coordinates; // Get the flat array

        // --- Helper to get UV pair ---
        const getUV = (faceIndex, cornerIndex) => {
            const faceOffset = faceIndex * 8; // 8 floats per face
            const uvIndex = faceOffset + cornerIndex * 2;
            if (uvIndex + 1 >= coords.length) {
                console.error(`UV index out of bounds for ${this.partType}, face ${faceIndex}, corner ${cornerIndex}`);
                return [0, 0]; // Default UV on error
            }
            // Return the pre-calculated U, V pair
            return [coords[uvIndex], coords[uvIndex + 1]];
        };

        // Assume coordinate array provides UVs for corners in order: BL, BR, TR, TL (Indices 0, 1, 2, 3) relative to the face

        // --- Add Faces (Triangles, Normals, Pre-calculated UVs) ---
        // Map UV corner indices to triangle vertices

        // Face +Z (Front) Tris: (v0, v1, v2), (v2, v3, v0). UVs: (uv0, uv1, uv2), (uv2, uv3, uv0)
        let uv0 = getUV(0, 0); let uv1 = getUV(0, 1); let uv2 = getUV(0, 2); let uv3 = getUV(0, 3);
        this.addTriangle(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]);
        this.adduv(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]);
        this.addNormal(0, 0, 1, 0, 0, 1, 0, 0, 1);
        this.addTriangle(v2[0], v2[1], v2[2], v3[0], v3[1], v3[2], v0[0], v0[1], v0[2]);
        this.adduv(uv2[0], uv2[1], uv3[0], uv3[1], uv0[0], uv0[1]);
        this.addNormal(0, 0, 1, 0, 0, 1, 0, 0, 1);

        // Face -Z (Back) Tris: (v4, v5, v6), (v6, v7, v4). UVs: (uv0, uv1, uv2), (uv2, uv3, uv0) from face index 1
        uv0 = getUV(1, 0); uv1 = getUV(1, 1); uv2 = getUV(1, 2); uv3 = getUV(1, 3);
        this.addTriangle(v4[0], v4[1], v4[2], v5[0], v5[1], v5[2], v6[0], v6[1], v6[2]);
        this.adduv(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]);
        this.addNormal(0, 0, -1, 0, 0, -1, 0, 0, -1);
        this.addTriangle(v6[0], v6[1], v6[2], v7[0], v7[1], v7[2], v4[0], v4[1], v4[2]);
        this.adduv(uv2[0], uv2[1], uv3[0], uv3[1], uv0[0], uv0[1]);
        this.addNormal(0, 0, -1, 0, 0, -1, 0, 0, -1);

        // Face +Y (Top) Tris: (v3, v2, v7), (v7, v6, v3). UVs: (uv0, uv1, uv2), (uv2, uv3, uv0) from face index 2
        uv0 = getUV(2, 0); uv1 = getUV(2, 1); uv2 = getUV(2, 2); uv3 = getUV(2, 3);
        this.addTriangle(v3[0], v3[1], v3[2], v2[0], v2[1], v2[2], v7[0], v7[1], v7[2]);
        this.adduv(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]); // Map UV corners 0,1,2 to vertices v3,v2,v7
        this.addNormal(0, 1, 0, 0, 1, 0, 0, 1, 0);
        this.addTriangle(v7[0], v7[1], v7[2], v6[0], v6[1], v6[2], v3[0], v3[1], v3[2]);
        this.adduv(uv2[0], uv2[1], uv3[0], uv3[1], uv0[0], uv0[1]); // Map UV corners 2,3,0 to vertices v7,v6,v3
        this.addNormal(0, 1, 0, 0, 1, 0, 0, 1, 0);

        // Face -Y (Bottom) Tris: (v5, v4, v1), (v1, v0, v5). UVs: (uv0, uv1, uv2), (uv2, uv3, uv0) from face index 3
        uv0 = getUV(3, 0); uv1 = getUV(3, 1); uv2 = getUV(3, 2); uv3 = getUV(3, 3);
        this.addTriangle(v5[0], v5[1], v5[2], v4[0], v4[1], v4[2], v1[0], v1[1], v1[2]);
        this.adduv(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]); // Map UV corners 0,1,2 to vertices v5,v4,v1
        this.addNormal(0, -1, 0, 0, -1, 0, 0, -1, 0);
        this.addTriangle(v1[0], v1[1], v1[2], v0[0], v0[1], v0[2], v5[0], v5[1], v5[2]);
        this.adduv(uv2[0], uv2[1], uv3[0], uv3[1], uv0[0], uv0[1]); // Map UV corners 2,3,0 to vertices v1,v0,v5
        this.addNormal(0, -1, 0, 0, -1, 0, 0, -1, 0);

        // Face +X (Right) Tris: (v1, v4, v7), (v7, v2, v1). UVs: (uv0, uv1, uv2), (uv2, uv3, uv0) from face index 4
        uv0 = getUV(4, 0); uv1 = getUV(4, 1); uv2 = getUV(4, 2); uv3 = getUV(4, 3);
        this.addTriangle(v1[0], v1[1], v1[2], v4[0], v4[1], v4[2], v7[0], v7[1], v7[2]);
        this.adduv(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]); // Map UV corners 0,1,2 to vertices v1,v4,v7
        this.addNormal(1, 0, 0, 1, 0, 0, 1, 0, 0);
        this.addTriangle(v7[0], v7[1], v7[2], v2[0], v2[1], v2[2], v1[0], v1[1], v1[2]);
        this.adduv(uv2[0], uv2[1], uv3[0], uv3[1], uv0[0], uv0[1]); // Map UV corners 2,3,0 to vertices v7,v2,v1
        this.addNormal(1, 0, 0, 1, 0, 0, 1, 0, 0);

        // Face -X (Left) Tris: (v5, v0, v3), (v3, v6, v5). UVs: (uv0, uv1, uv2), (uv2, uv3, uv0) from face index 5
        uv0 = getUV(5, 0); uv1 = getUV(5, 1); uv2 = getUV(5, 2); uv3 = getUV(5, 3);
        this.addTriangle(v5[0], v5[1], v5[2], v0[0], v0[1], v0[2], v3[0], v3[1], v3[2]);
        this.adduv(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]); // Map UV corners 0,1,2 to vertices v5,v0,v3
        this.addNormal(-1, 0, 0, -1, 0, 0, -1, 0, 0);
        this.addTriangle(v3[0], v3[1], v3[2], v6[0], v6[1], v6[2], v5[0], v5[1], v5[2]);
        this.adduv(uv2[0], uv2[1], uv3[0], uv3[1], uv0[0], uv0[1]); // Map UV corners 2,3,0 to vertices v3,v6,v5
        this.addNormal(-1, 0, 0, -1, 0, 0, -1, 0, 0);

    }
}