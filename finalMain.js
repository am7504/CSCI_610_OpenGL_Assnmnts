'use strict';

// --- Global variables ---
let gl;
let program;
let headModel, bodyModel, leftArmModel, rightArmModel, leftLegModel, rightLegModel;

// --- Pre-calculated UV Coordinates (from your source) ---
// Stores the specific UVs for each vertex of each face for each part
const precalculatedUVs = {
    head_boy : {
        coordinates : [ // F, B, T, Btm, R, L (4 UV pairs per face)
            // Front (V=0 bottom, V=1 top matching WebGL?) Check source again. Assuming V=1 is TOP here based on prev data.
             0.25, 0.50,  0.50, 0.50,  0.50, 1.00,  0.25, 1.00, // Front BL, BR, TR, TL
             0.75, 0.50,  1.00, 0.50,  1.00, 1.00,  0.75, 1.00, // Back BL, BR, TR, TL
             0.25, 0.00,  0.50, 0.00,  0.50, 0.50,  0.25, 0.50, // Top FrontL, FrontR, BackR, BackL? Let's map to v0,v1,v2,v3 standard quad
             0.50, 0.00,  0.75, 0.00,  0.75, 0.50,  0.50, 0.50, // Bottom FrontL, FrontR, BackR, BackL?
             0.00, 0.50,  0.25, 0.50,  0.25, 1.00,  0.00, 1.00, // Right BottomF, BottomB, TopB, TopF?
             0.50, 0.50,  0.75, 0.50,  0.75, 1.00,  0.50, 1.00  // Left BottomF, BottomB, TopB, TopF?
             // NOTE: The exact mapping of these 4 pairs per face to the 2 triangles needs care!
        ]
    },
    body_boy : {
        coordinates : [
            0.25, 0.25,  0.50, 0.25,  0.50, 1.00,  0.25, 1.00, // Front
            0.75, 0.25,  1.00, 0.25,  1.00, 1.00,  0.75, 1.00, // Back
            0.25, 0.00,  0.50, 0.00,  0.50, 0.25,  0.25, 0.25, // Top
            0.50, 0.00,  0.75, 0.00,  0.75, 0.25,  0.50, 0.25, // Bottom
            0.00, 0.25,  0.25, 0.25,  0.25, 1.00,  0.00, 1.00, // Right
            0.50, 0.25,  0.75, 0.25,  0.75, 1.00,  0.50, 1.00  // Left
        ]
    },
    arm_boy : {
        coordinates : [
            0.25, 0.25,  0.50, 0.25,  0.50, 1.00,  0.25, 1.00, // Front
            0.75, 0.25,  1.00, 0.25,  1.00, 1.00,  0.75, 1.00, // Back
            0.25, 0.00,  0.50, 0.00,  0.50, 0.25,  0.25, 0.25, // Top
            0.50, 0.00,  0.75, 0.00,  0.75, 0.25,  0.50, 0.25, // Bottom
            0.00, 0.25,  0.25, 0.25,  0.25, 1.00,  0.00, 1.00, // Right
            0.50, 0.25,  0.75, 0.25,  0.75, 1.00,  0.50, 1.00  // Left
        ]
    },
    leg_boy : {
        coordinates : [
            0.25, 0.25,  0.50, 0.25,  0.50, 1.00,  0.25, 1.00, // Front
            0.75, 0.25,  1.00, 0.25,  1.00, 1.00,  0.75, 1.00, // Back
            0.25, 0.00,  0.50, 0.00,  0.50, 0.25,  0.25, 0.25, // Top
            0.50, 0.00,  0.75, 0.00,  0.75, 0.25,  0.50, 0.25, // Bottom
            0.00, 0.25,  0.25, 0.25,  0.25, 1.00,  0.00, 1.00, // Right
            0.50, 0.25,  0.75, 0.25,  0.75, 1.00,  0.50, 1.00  // Left
        ]
    },
};

// Texture OBJECTS will be stored here after loading
let loadedTextures = {
    head_boy: null,
    body_boy: null,
    arm_boy: null,
    leg_boy: null
};

// --- Camera / Light / Material Globals ---
let eyePos = [-2, 3, 2];
let lightPos = [0.0, 3.0, 2.0];
let lightColor = [1.0, 1.0, 2.0];
let ambientColor = [0.3, 0.2, 0.5];
let materialSpecularColor = [0.7, 0.7, 0.7];
let shininess = 8.0;


// --- Texture Loading Helper Functions ---
function isPowerOf2(value) { return value > 0 && (value & (value - 1)) === 0; }

function loadTexture(url, textureKey) { // Modified to store in loadedTextures
    if (!gl) { console.error("loadTexture: WebGL context not available."); return null; }

    const texture = gl.createTexture();
    loadedTextures[textureKey] = texture; // Store the object using the key

    gl.bindTexture(gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([0, 0, 255, 255]); // Blue placeholder
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    const image = new Image();
    image.src = url; // Use the file path URL

    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // FLIP Y - because the precalculated UVs use V=1 for top, V=0 for bottom (WebGL standard)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // <<< SET TO TRUE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
             gl.generateMipmap(gl.TEXTURE_2D);
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        } else {
             console.warn(`Texture ${url} not PoT. Using NEAREST filtering.`);
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        console.log("Texture loaded:", url);
        draw();
    };
    image.onerror = () => { console.error("Failed to load texture image:", url); };
    return texture; // Return immediately
}

// --- Setup Functions ---
function setUpTextures() {
    console.log("Loading body part texture files...");
    // *** REPLACE WITH YOUR ACTUAL RELATIVE FILE PATHS ***
    loadTexture("steve.head.png", "head_boy");
    loadTexture("steve.body.png", "body_boy");
    loadTexture("steve.arm.png",  "arm_boy");
    loadTexture("steve.leg.png",  "leg_boy");
}

function createShapes() {
    // Subdivision is ignored by the Cube class using pre-calculated UVs
    console.log("Creating Steve model parts (using pre-calculated UV Cube)...");
    headModel     = new Cube("head_boy"); // Pass the key used in precalculatedUVs
    bodyModel     = new Cube("body_boy");
    // Decide which texture/UVs to use for arms/legs.
    // If left/right arms use same texture and UV layout (unlikely), use "arm_boy"
    // If they need flipping or unique UVs, you'd need "left_arm_boy" etc. in precalculatedUVs
    // For now, assume "arm_boy" and "leg_boy" coordinates work for both sides.
    leftArmModel  = new Cube("arm_boy");
    rightArmModel = new Cube("arm_boy");
    leftLegModel  = new Cube("leg_boy");
    rightLegModel = new Cube("leg_boy");

    console.log("Binding VAOs...");
    headModel.VAO = bindVAO(headModel);
    leftLegModel.VAO = bindVAO(leftLegModel);
    rightLegModel.VAO = bindVAO(rightLegModel);
    bodyModel.VAO = bindVAO(bodyModel);
    leftArmModel.VAO = bindVAO(leftArmModel);
    rightArmModel.VAO = bindVAO(rightArmModel);
    // ... (Error check VAOs) ...
}



function setUpCamera() {
    if (!program) return;
    // --- Projection Matrix ---
    let projMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projMatrix, radians(60), 1.0, 0.1, 300.0); // Near plane 0.1 might be better than 1.0
    if(program.uProjT) gl.uniformMatrix4fv(program.uProjT, false, projMatrix);

    // --- View Matrix ---
    let viewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(viewMatrix, eyePos, [0, 1, 0], [0, 1, 0]);
    if(program.uViewT) gl.uniformMatrix4fv(program.uViewT, false, viewMatrix);

    // --- View Position Uniform (World Space) ---
    if(program.uViewPos) gl.uniform3fv(program.uViewPos, eyePos);

    // --- Light Position Uniform (View Space) ---
    let lightPosView = glMatrix.vec3.create();
    glMatrix.vec3.transformMat4(lightPosView, lightPos, viewMatrix); // Transform world light pos to view space
    if(program.uLightPos) gl.uniform3fv(program.uLightPos, lightPosView);
}

function initPrograms() {
    const vertexShader = getShader('wireframe-V');
    const fragmentShader = getShader('wireframe-F');
    if (!vertexShader || !fragmentShader) { /* ... error ... */ return; }
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { /* ... error ... */ return; }
    gl.useProgram(program);

    // --- Get Locations ---
    program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    program.aNormal = gl.getAttribLocation(program, 'aNormal');
    program.aUV = gl.getAttribLocation(program, 'aUV');
    program.uModelT = gl.getUniformLocation(program, 'uModelT');
    program.uViewT = gl.getUniformLocation(program, 'uViewT');
    program.uProjT = gl.getUniformLocation(program, 'uProjT');
    program.uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');
    program.uSampler = gl.getUniformLocation(program, 'uSampler');
    program.uLightPos = gl.getUniformLocation(program, 'uLightPos');
    program.uViewPos = gl.getUniformLocation(program, 'uViewPos');
    program.uLightColor = gl.getUniformLocation(program, 'uLightColor');
    program.uAmbientColor = gl.getUniformLocation(program, 'uAmbientColor');
    program.uMaterialSpecularColor = gl.getUniformLocation(program, 'uMaterialSpecularColor');
    program.uShininess = gl.getUniformLocation(program, 'uShininess');

    // --- Location Checks (Optional but Recommended) ---
    // ... add checks here if desired ...

    // --- Set Static Uniforms ---
    if (program.uLightColor) gl.uniform3fv(program.uLightColor, lightColor);
    if (program.uAmbientColor) gl.uniform3fv(program.uAmbientColor, ambientColor);
    if (program.uMaterialSpecularColor) gl.uniform3fv(program.uMaterialSpecularColor, materialSpecularColor);
    if (program.uShininess) gl.uniform1f(program.uShininess, shininess);
}

function bindVAO(shape) { /* ... (keep version from response #17, ensure it sets up aVertexPosition(4), aNormal(3), aUV(2) and checks attribute locations/data existence) ... */ 
    if (!program) { console.error("bindVAO: Shader program invalid."); return null; }
    let theVAO = gl.createVertexArray();
    gl.bindVertexArray(theVAO);

    // Position
    if (program.aVertexPosition !== -1 && shape.points && shape.points.length > 0) {
        let buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.points), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(program.aVertexPosition);
        gl.vertexAttribPointer(program.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
    } else { console.warn("bindVAO: Missing position data or attribute."); }
    // Normal
    if (program.aNormal !== -1 && shape.normals && shape.normals.length > 0) {
         let buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.normals), gl.STATIC_DRAW);
         gl.enableVertexAttribArray(program.aNormal);
         gl.vertexAttribPointer(program.aNormal, 3, gl.FLOAT, false, 0, 0);
    } else { if (!shape.normals || shape.normals.length === 0) console.warn("bindVAO: Shape missing normal data."); }
    // UV
    if (program.aUV !== -1 && shape.uv && shape.uv.length > 0) {
         let buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.uv), gl.STATIC_DRAW);
         gl.enableVertexAttribArray(program.aUV);
         gl.vertexAttribPointer(program.aUV, 2, gl.FLOAT, false, 0, 0);
    } else { if (!shape.uv || shape.uv.length === 0) console.warn("bindVAO: Shape missing UV data."); }
    // Indices
    if (shape.indices && shape.indices.length > 0) {
        let buf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);
    } else { console.error("bindVAO: Shape missing index data!"); gl.bindVertexArray(null); return null; }

    gl.bindVertexArray(null); gl.bindBuffer(gl.ARRAY_BUFFER, null); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return theVAO;
}

function drawShapes() {
    if (!headModel || !headModel.VAO || !bodyModel || !bodyModel.VAO || !leftArmModel || !leftArmModel.VAO || !rightArmModel || !rightArmModel.VAO || !leftLegModel || !leftLegModel.VAO || !rightLegModel || !rightLegModel.VAO) {
        return;
    }
    // Check loadedTextures, not the precalculatedUVs structure
    if (!loadedTextures.head_boy || !loadedTextures.body_boy || !loadedTextures.arm_boy || !loadedTextures.leg_boy) { return; }

   // --- Transforms ---
   const headScale = [0.5, 0.5, 0.5]; const bodyScale = [0.5, 0.75, 0.25]; const limbScale = [0.25, 0.75, 0.25];
   const bodyPos = [0.0, 1.125, 0.0]; const headPos = [0.1, 1.68, 0.0];
   const rightArmPos = [0.375, 1.125, 0.0]; const leftArmPos = [-0.375, 1.5, -0.1];
   const rightLegPos = [0.125, 0.375, 0.0]; const leftLegPos = [-0.125, 0.375, 0.0];

   // --- Draw Each Part with its Specific Texture Object from loadedTextures ---
   drawHelper(headModel,     { rotation: {axis: [1, -1, 0], angle:90 }, translate: headPos,     scale: headScale, texture: loadedTextures.head_boy });
   drawHelper(bodyModel,     { translate: bodyPos,     scale: bodyScale, texture: loadedTextures.body_boy });
   drawHelper(rightArmModel, { rotation: {axis: [1, 0, 0], angle:-70 }, translate: rightArmPos, scale: limbScale, texture: loadedTextures.arm_boy });
   drawHelper(leftArmModel,  { rotation: {axis: [1, 0, 0], angle:-190 }, translate: leftArmPos,  scale: limbScale, texture: loadedTextures.arm_boy }); // Assuming same texture object works
   drawHelper(rightLegModel, { translate: rightLegPos, scale: limbScale, texture: loadedTextures.leg_boy });
   drawHelper(leftLegModel,  { translate: leftLegPos,  scale: limbScale, texture: loadedTextures.leg_boy }); // Assuming same texture object works
}

// --- Draw Helper (Handles transformations, uniforms, drawing) ---
// Replace your existing drawHelper function with this exact code:
function drawHelper(model, {
    translate = [0, 0, 0],    // Default translation
    scale = [1, 1, 1],        // Default scale
    rotation = { axis: [0, 1, 0], angle: 0 }, // Default rotation
    texture = null            // Default texture
} = {}) { // <<< Ensure this destructuring signature is correct

    // Basic checks
    if (!program || !model || !model.VAO ) {
        console.error("drawHelper cannot execute: Invalid program or model/VAO.");
        return;
    }
    if (!glMatrix) { // Ensure glMatrix library is loaded/available
        console.error("drawHelper cannot execute: glMatrix library not found.");
        return;
    }

    // --- Model Matrix ---
    let modelMatrix = glMatrix.mat4.create();
    // Use the destructured 'translate', 'rotation', 'scale' variables
    glMatrix.mat4.translate(modelMatrix, modelMatrix, translate);
    if (rotation && rotation.angle !== 0) {
        // Ensure radians function is available
        if (typeof radians !== 'function') {
             console.error("drawHelper: radians() function is not defined.");
        } else {
            glMatrix.mat4.rotate(modelMatrix, modelMatrix, radians(rotation.angle), rotation.axis);
        }
    }
    glMatrix.mat4.scale(modelMatrix, modelMatrix, scale);
    // Send Model Matrix uniform
    if(program.uModelT) {
        gl.uniformMatrix4fv(program.uModelT, false, modelMatrix);
    } else {
        console.warn("drawHelper: uModelT uniform location not found.");
    }


    // --- Normal Matrix (for lighting) ---
    if(program.uNormalMatrix) {
        // Need viewMatrix - assuming it's accessible or calculated correctly elsewhere
        // For safety, recalculate here if needed, or ensure setUpCamera provides it globally/cached
        let currentViewMatrix = glMatrix.mat4.create(); // Get current view matrix
        glMatrix.mat4.lookAt(currentViewMatrix, eyePos, [-1, 0, 0], [0, 1, 0]); // Assumes eyePos is correct global

        let modelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.multiply(modelViewMatrix, currentViewMatrix, modelMatrix);

        let normalMatrix = glMatrix.mat3.create();
        glMatrix.mat3.normalFromMat4(normalMatrix, modelViewMatrix); // Calculate normal matrix
        gl.uniformMatrix3fv(program.uNormalMatrix, false, normalMatrix);
    } // No warning here as lighting might be optional


    // --- Bind Specific Texture ---
    // Use the destructured 'texture' variable
    if (program.uSampler && texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.uSampler, 0);
    } else {
         // Unbind or bind a default texture if 'texture' is null
         gl.activeTexture(gl.TEXTURE0); // Still need to activate unit 0? Maybe not necessary if just unbinding.
         gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // --- Bind VAO and Draw ---
    gl.bindVertexArray(model.VAO);
    if (model.indices && model.indices.length > 0) {
        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
    } else {
        console.error("drawHelper: Model has no indices to draw.");
    }

    // --- Clean Up ---
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
}

function draw() { /* ... (keep version from response #17) ... */ 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    if (program && gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program);
        setUpCamera(); // Update view/proj matrix, viewPos, lightPosView
        drawShapes();
    }
}

// --- Initialization ---
function init() { /* ... (keep version from response #17, calls initPrograms, setUpTextures, createShapes, setUpCamera, draw) ... */ 
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) { console.error("No canvas"); return null; }
    gl = canvas.getContext('webgl2');
    if (!gl) { console.error("No WebGL2"); canvas.innerHTML = "Requires WebGL 2.0"; return null; }
    // Event listeners
    window.addEventListener('keydown', gotKey, false); // Assuming gotKey exists elsewhere
    // GL Setup
    gl.clearColor(0.1, 0.1, 0.15, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.depthFunc(gl.LEQUAL);
    // Init sequence
    initPrograms();
    if (program) {
        setUpTextures(); // Start loading textures
        createShapes();  // Create geometry and VAOs
        setUpCamera();   // Set initial camera/lighting uniforms
        // Initial draw might happen before textures load, placeholder will be used
        draw();
    } else { console.error("Init failed: Shader program error."); }
}

// --- Utilities ---
function getShader(id) { /* ... (keep improved version from response #10) ... */ 
    const script = document.getElementById(id);
    if (!script) { console.error(`Shader script element with id "${id}" not found.`); return null; }
    const shaderString = script.text.trim(); let shader;
    if (script.type === 'x-shader/x-vertex') { shader = gl.createShader(gl.VERTEX_SHADER); }
    else if (script.type === 'x-shader/x-fragment') { shader = gl.createShader(gl.FRAGMENT_SHADER); }
    else { console.error(`Unknown shader type for script id "${id}": ${script.type}`); return null; }
    gl.shaderSource(shader, shaderString); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Shader compilation error for "${id}":\n${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader); return null;
    } return shader;
}
function radians(degrees) { /* ... (keep version from response #10) ... */ 
    return degrees * Math.PI / 180.0;
}

// Make sure gl-matrix library is loaded in the HTML before this script.
// Make sure event.js (for gotKey) is loaded.
// Make sure the shape definition file (with cgIShape and simplified Cube) is loaded.
// Make sure the HTML includes the correct shader scripts for 'wireframe-V' and 'wireframe-F'.

// Run init once the window loads
// window.onload = init; // Make sure this is called in your HTML