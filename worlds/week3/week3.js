"use strict"

async function setup(state) {
    let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
        { 
            key : "pnoise", path : "shaders/noise.glsl", foldDefault : true
        },
        {
            key : "sharedlib1", path : "shaders/sharedlib1.glsl", foldDefault : true
        },      
    ]);

    if (!libSources) {
        throw new Error("Could not load shader library");
    }


    // load vertex and fragment shaders from the server, register with the editor
    let shaderSource = await MREditor.loadAndRegisterShaderForLiveEditing(
        gl,
        "mainShader",
        { 
            onNeedsCompilation : (args, libMap, userData) => {
                const stages = [args.vertex, args.fragment];
                const output = [args.vertex, args.fragment];

                const implicitNoiseInclude = true;
                if (implicitNoiseInclude) {
                    let libCode = MREditor.libMap.get("pnoise");

                    for (let i = 0; i < 2; i += 1) {
                        const stageCode = stages[i];
                        const hdrEndIdx = stageCode.indexOf(';');
                        
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        
                        output[i] = hdr + "\n#line 2 1\n" + 
                                    "#include<pnoise>\n#line " + (hdr.split('\n').length + 1) + " 0" + 
                            stageCode.substring(hdrEndIdx + 1);

                        console.log(output[i]);
                    }
                }

                MREditor.preprocessAndCreateShaderProgramFromStringsAndHandleErrors(
                    output[0],
                    output[1],
                    libMap
                );
            },
            onAfterCompilation : (program) => {
                state.program = program;

                gl.useProgram(program);

                // Assign MVP matrices
                state.uModelLoc        = gl.getUniformLocation(program, 'uModel');
                state.uViewLoc         = gl.getUniformLocation(program, 'uView');
                state.uProjLoc         = gl.getUniformLocation(program, 'uProj');
                state.uTimeLoc         = gl.getUniformLocation(program, 'uTime');

                state.uMaterialsLoc = []
                state.uMaterialsLoc[0] = {};
                state.uMaterialsLoc[0].diffuse  = gl.getUniformLocation(program, 'uMaterials[0].diffuse');
                state.uMaterialsLoc[0].ambient  = gl.getUniformLocation(program, 'uMaterials[0].ambient');
                state.uMaterialsLoc[0].specular = gl.getUniformLocation(program, 'uMaterials[0].specular');
                state.uMaterialsLoc[0].power    = gl.getUniformLocation(program, 'uMaterials[0].power');
                state.uMaterialsLoc[0].reflectc = gl.getUniformLocation(program, 'uMaterials[0].reflectc');
                state.uMaterialsLoc[0].refraction = gl.getUniformLocation(program, 'uMaterials[0].refraction');
                state.uMaterialsLoc[0].transparent = gl.getUniformLocation(program, 'uMaterials[0].transparent');

                state.uMaterialsLoc[1] = {};
                state.uMaterialsLoc[1].diffuse  = gl.getUniformLocation(program, 'uMaterials[1].diffuse');
                state.uMaterialsLoc[1].ambient  = gl.getUniformLocation(program, 'uMaterials[1].ambient');
                state.uMaterialsLoc[1].specular = gl.getUniformLocation(program, 'uMaterials[1].specular');
                state.uMaterialsLoc[1].power    = gl.getUniformLocation(program, 'uMaterials[1].power');
                state.uMaterialsLoc[1].reflectc = gl.getUniformLocation(program, 'uMaterials[1].reflectc');
                state.uMaterialsLoc[1].refraction = gl.getUniformLocation(program, 'uMaterials[1].refraction');
                state.uMaterialsLoc[1].transparent = gl.getUniformLocation(program, 'uMaterials[1].transparent');

                state.uMaterialsLoc[2] = {};
                state.uMaterialsLoc[2].diffuse  = gl.getUniformLocation(program, 'uMaterials[2].diffuse');
                state.uMaterialsLoc[2].ambient  = gl.getUniformLocation(program, 'uMaterials[2].ambient');
                state.uMaterialsLoc[2].specular = gl.getUniformLocation(program, 'uMaterials[2].specular');
                state.uMaterialsLoc[2].power    = gl.getUniformLocation(program, 'uMaterials[2].power');
                state.uMaterialsLoc[2].reflectc = gl.getUniformLocation(program, 'uMaterials[2].reflectc');
                state.uMaterialsLoc[2].refraction = gl.getUniformLocation(program, 'uMaterials[2].refraction');
                state.uMaterialsLoc[2].transparent = gl.getUniformLocation(program, 'uMaterials[2].transparent');

                state.uMaterialsLoc[3] = {};
                state.uMaterialsLoc[3].diffuse  = gl.getUniformLocation(program, 'uMaterials[3].diffuse');
                state.uMaterialsLoc[3].ambient  = gl.getUniformLocation(program, 'uMaterials[3].ambient');
                state.uMaterialsLoc[3].specular = gl.getUniformLocation(program, 'uMaterials[3].specular');
                state.uMaterialsLoc[3].power    = gl.getUniformLocation(program, 'uMaterials[3].power');
                state.uMaterialsLoc[3].reflectc = gl.getUniformLocation(program, 'uMaterials[3].reflectc');
                state.uMaterialsLoc[3].refraction = gl.getUniformLocation(program, 'uMaterials[3].refraction');
                state.uMaterialsLoc[3].transparent = gl.getUniformLocation(program, 'uMaterials[3].transparent');
            } 
        },
        {
            paths : {
                vertex   : "shaders/vertex.vert.glsl",
                fragment : "shaders/fragment.frag.glsl"
            },
            foldDefault : {
                vertex   : true,
                fragment : false
            }
        }
    );

    if (!shaderSource) {
        throw new Error("Could not load shader");
    }


    // Create a square as a triangle strip consisting of two triangles
    state.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0, 1,1,0, -1,-1,0, 1,-1,0]), gl.STATIC_DRAW);

    // Assign aPos attribute to each vertex
    let aPos = gl.getAttribLocation(state.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
}

// NOTE: t is the elapsed time since system start in ms, but
// each world could have different rules about time elapsed and whether the time
// is reset after returning to the world
function onStartFrame(t, state) {
    // (KTR) TODO implement option so a person could pause and resume elapsed time
    // if someone visits, leaves, and later returns
    let tStart = t;
    if (!state.tStart) {
        state.tStart = t;
        state.time = t;
    }

    tStart = state.tStart;

    let now = (t - tStart);
    // different from t, since t is the total elapsed time in the entire system, best to use "state.time"
    state.time = now;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let time = now / 1000;    

    gl.uniform1f(state.uTimeLoc, time);

    gl.uniform3fv(state.uMaterialsLoc[0].ambient , [0.,.1,.1]);
    gl.uniform3fv(state.uMaterialsLoc[0].diffuse , [0.,.5,.5]);
    gl.uniform3fv(state.uMaterialsLoc[0].specular, [0.,1.,1.]);
    gl.uniform1f (state.uMaterialsLoc[0].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[0].reflectc , [0.5,0.5,0.5]);
    gl.uniform3fv(state.uMaterialsLoc[0].transparent, [0.5,0.5,0.5]);
    gl.uniform1f (state.uMaterialsLoc[0].refraction   , 1.5);

    gl.uniform3fv(state.uMaterialsLoc[1].ambient , [0.0314, 0.098, 0.0]);
    gl.uniform3fv(state.uMaterialsLoc[1].diffuse , [0.05, 0.25, 0.0]);
    gl.uniform3fv(state.uMaterialsLoc[1].specular, [1.,1.,1.]);
    gl.uniform1f (state.uMaterialsLoc[1].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[1].reflectc , [0.5, 0.5, 0.5]);
    gl.uniform3fv(state.uMaterialsLoc[1].transparent, [0.5, 0.5, 0.5]);
    gl.uniform1f (state.uMaterialsLoc[1].refraction   , 1.5);

    gl.uniform3fv(state.uMaterialsLoc[2].ambient , [.1,.1,0.]);
    gl.uniform3fv(state.uMaterialsLoc[2].diffuse , [.4,.1,0.3]);
    gl.uniform3fv(state.uMaterialsLoc[2].specular, [1.,1.,1.]);
    gl.uniform1f (state.uMaterialsLoc[2].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[2].reflectc , [0.4, 0.4, 0.4]);
    gl.uniform3fv(state.uMaterialsLoc[2].transparent, [0.4, 0.4, 0.4]);
    gl.uniform1f (state.uMaterialsLoc[2].refraction   , 1.5);

    gl.uniform3fv(state.uMaterialsLoc[3].ambient , [0.0, 0.25, 0.5]);
    gl.uniform3fv(state.uMaterialsLoc[3].diffuse , [0.098, 0.2549, 0.4]);
    gl.uniform3fv(state.uMaterialsLoc[3].specular, [1.,1.,1.]);
    gl.uniform1f (state.uMaterialsLoc[3].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[3].reflectc , [0.4, 0.4, 0.4]);
    gl.uniform3fv(state.uMaterialsLoc[3].transparent, [0.4, 0.4, 0.4]);
    gl.uniform1f (state.uMaterialsLoc[3].refraction   , 2.0);


    gl.enable(gl.DEPTH_TEST);
}

function onDraw(t, projMat, viewMat, state, eyeIdx) {
    const sec = state.time / 1000;

    const my = state;
  
    gl.uniformMatrix4fv(my.uModelLoc, false, new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-1,1]));
    gl.uniformMatrix4fv(my.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(my.uProjLoc, false, new Float32Array(projMat));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function onEndFrame(t, state) {
}

export default function main() {
    const def = {
        name         : 'week3',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
