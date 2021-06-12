import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;
export class Shape_From_File extends Shape {                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                                                               // all its arrays' data from an .obj 3D model file.
    constructor(filename) {
        super("position", "normal", "texture_coord");
        // Begin downloading the mesh. Once that completes, return
        // control to our parse_into_mesh function.
        this.load_file(filename);
    }

    load_file(filename) {                             // Request the external file and wait for it to load.
        // Failure mode:  Loads an empty shape.
        return fetch(filename)
            .then(response => {
                if (response.ok) return Promise.resolve(response.text())
                else return Promise.reject(response.status)
            })
            .then(obj_file_contents => this.parse_into_mesh(obj_file_contents))
            .catch(error => {
                this.copy_onto_graphics_card(this.gl);
            })
    }

    parse_into_mesh(data) {                           // Adapted from the "webgl-obj-loader.js" library found online:
        var verts = [], vertNormals = [], textures = [], unpacked = {};

        unpacked.verts = [];
        unpacked.norms = [];
        unpacked.textures = [];
        unpacked.hashindices = {};
        unpacked.indices = [];
        unpacked.index = 0;

        var lines = data.split('\n');

        var VERTEX_RE = /^v\s/;
        var NORMAL_RE = /^vn\s/;
        var TEXTURE_RE = /^vt\s/;
        var FACE_RE = /^f\s/;
        var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var elements = line.split(WHITESPACE_RE);
            elements.shift();

            if (VERTEX_RE.test(line)) verts.push.apply(verts, elements);
            else if (NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
            else if (TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
            else if (FACE_RE.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
                    if (j === 3 && !quad) {
                        j = 2;
                        quad = true;
                    }
                    if (elements[j] in unpacked.hashindices)
                        unpacked.indices.push(unpacked.hashindices[elements[j]]);
                    else {
                        var vertex = elements[j].split('/');

                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                        if (textures.length) {
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
                        }

                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);

                        unpacked.hashindices[elements[j]] = unpacked.index;
                        unpacked.indices.push(unpacked.index);
                        unpacked.index += 1;
                    }
                    if (j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
                }
            }
        }
        {
            const {verts, norms, textures} = unpacked;
            for (var j = 0; j < verts.length / 3; j++) {
                this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
                this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
                this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
            }
            this.indices = unpacked.indices;
        }
        this.normalize_positions(false);
        this.ready = true;
    }

    draw(context, program_state, model_transform, material) {               // draw(): Same as always for shapes, but cancel all
        // attempts to draw the shape before it loads:
        if (this.ready)
            super.draw(context, program_state, model_transform, material);
    }
}

export class Assignment3 extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.hover = false;
        this.birdCreationTimes = [];
        this.birdPositions = [];
        this.numBirds = 0;
        this.startTime = 0;
        this.endPoint = vec3(0,0,0);
        this.startPoint = vec3(0,0,0);
        
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            /*
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            
            circle: new defs.Regular_2D_Polygon(1, 15),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
            sun: new defs.Subdivision_Sphere(4),
            planet_1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            planet_2: new defs.Subdivision_Sphere(3),
            planet_3: new defs.Subdivision_Sphere(4),
            ring: new defs.Torus(15, 15),
            planet_4: new defs.Subdivision_Sphere(4),
            moon: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            */
            sphere: new defs.Subdivision_Sphere(4),
            eyes: new Shape_From_File("assets/eyes.obj"),
            body: new Shape_From_File("assets/body.obj"),
            beak: new Shape_From_File("assets/beak.obj"),
            neck: new Shape_From_File("assets/neck.obj"),
            wing: new Shape_From_File("assets/wing.obj"),
            head: new Shape_From_File("assets/head.obj"),
            gun: new Shape_From_File("assets/guns.obj"),

        };
       
        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#992828")}),
            ring: new Material(new Ring_Shader(),
            {color: hex_color("#ffffff")}),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)
            eye: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: 1, color: hex_color("#080808")}),
            neck: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: 1, color: hex_color("#FDFDFD")}),
            peak: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: 1, color: hex_color("#FFB544")}),
            body: new Material(new defs.Phong_Shader(),
                {ambient: 0.6, diffusivity: 1, specularity: 0.1, color: hex_color("#36250d")}),
            head: new Material(new defs.Phong_Shader(),
                {ambient: 0.6, diffusivity: 1, specularity: 0.1, color: hex_color("#d1c2ce")}),
        }
        
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 50), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Shoot", ["c"], () => { this.hover ^= 1; });
        this.new_line();
    }

    drawBird(context, program_state, t, model_transform){
        let rot = model_transform.times(Mat4.scale(1.2,1.2,1.2)).times(Mat4.rotation(0.6*Math.sin(2*t),0,0,1));
        let rot1 = model_transform.times(Mat4.scale(1.2,1.2,1.2)).times(Mat4.rotation(-0.6*Math.sin(2*t),0,0,1));
        let lw = rot.times(Mat4.translation(-2,0.6,0.8));
        let rw = rot1.times(Mat4.scale(-1,1,1)).times(Mat4.translation(-2,0.6,0.8));    
        let bod = model_transform.times(Mat4.scale(1.1,1.1,1.1)).times(Mat4.translation(0,0,-1));
        this.shapes.body.draw(context, program_state, bod, this.materials.body);
        this.shapes.wing.draw(context, program_state, lw, this.materials.body);
        this.shapes.wing.draw(context, program_state, rw, this.materials.body);
        
        let nk = model_transform.times(Mat4.translation(0,0,2)).times(Mat4.scale(1/2,1/2,1/2));
        this.shapes.neck.draw(context, program_state, nk, this.materials.neck);
        let hd = model_transform.times(Mat4.translation(0,-0.5,3.75)).times(Mat4.scale(1/2,1/2,1/2)).times(Mat4.rotation(Math.PI/2,1,0,0));
        this.shapes.head.draw(context, program_state, hd, this.materials.head);
        let bk = model_transform.times(Mat4.translation(0,-0.65,4.7)).times(Mat4.scale(0.45,0.45,0.45));
        this.shapes.beak.draw(context, program_state, bk, this.materials.peak);
        let ey = model_transform.times(Mat4.translation(0,-0.23,4)).times(Mat4.scale(1/2,1/2,1/2));
        this.shapes.eyes.draw(context, program_state, ey, this.materials.eye);

    }


    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);
        
        /*
        if(this.attached !== undefined){
            let desired = this.attached();
            if(desired === "solar"){
                desired = this.initial_camera_location;
            }
            else{
                desired = Mat4.inverse(desired.times(Mat4.translation(0,0,5)));
            }
            
            desired = desired.map((x,i)=>Vector.from(program_state.camera_inverse[i]).mix(x,0.1));
            program_state.set_camera(desired);
        }
        else{
            program_state.set_camera(this.initial_camera_location);
        }
        */
        
        // TODO: Lighting (Requirement 2)
        const light_position = vec4(10, 10, 10, 1);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const i = Math.cos(t) + 2;
        
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];
        
        let n = context.context.mousePos;
        let x = n[0]/20;
        let y = n[1]/20;
        let angle1 = Math.atan2(x,40);
        let angle2 = Math.atan2(y,40);
        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        let model_transform = Mat4.identity();
        let camera = Mat4.look_at(vec3(0, 10, 50), vec3(x, y, 0), vec3(0, 1, 0));   
        
        let weapon = model_transform.times(Mat4.translation(x/10,5+y/5,40)); 
        weapon = weapon.times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.rotation(Math.PI-2*angle1,0,0,1)).times(Mat4.rotation(-2*angle2,1,0,0));
        weapon = weapon.times(Mat4.scale(1,1,1));
        
        if(this.hover){
            if(this.startTime == 0){
                this.startTime = t;
                this.endPoint = vec3(x + Math.sin(angle1) * 135,y + Math.sin(angle2) * 145 - 15,-50);
                this.startPoint = vec3(x - Math.sin(angle1) * 34,y - Math.sin(angle2) * 34,25);
            } 
            let time = (t-this.startTime);
            let gun = Mat4.identity();
            gun = gun.times(Mat4.translation(this.startPoint[0]*(1-2*time)+this.endPoint[0]*2*time,this.startPoint[1]*(1-2*time)+this.endPoint[1]*2*time  ,this.startPoint[2]*(1-2*time)+this.endPoint[2]*2*time));
            //gun = gun.times(Mat4.translation(-this.gunAim[0]/80,5,40));
            
            //gun = gun.times(Mat4.translation(0,10*(t-this.startTime) - 10*(t-this.startTime)**2, -50*(t-this.startTime)));
            this.shapes.sphere.draw(context, program_state, gun, this.materials.test)
            if(t - this.startTime > 0.5){
                this.startTime = 0;
                this.hover = false;
            }
        }
        //let aim = Mat4.look_at(vec3(0, 10, 50), vec3(-x, -y, 0),vec3(0, 1, 0));  
        
        this.shapes.gun.draw(context, program_state, weapon, this.materials.test)
           
          
        program_state.set_camera(camera);
      
       
        let createBird = Math.random();
        if(createBird > 0.997)
        {
            this.numBirds = this.numBirds + 1;
            this.birdCreationTimes.push(t);
            let dir = Math.random() < 0.5 ? -1:1;
            let pos = model_transform.times(Mat4.translation(-45 * dir,Math.random() * 20 - 10,Math.random()*30)).times(Mat4.rotation(dir * Math.PI/2,0,1,0))
            this.birdPositions.push(pos)
        }
        let j = 0;
        for(j=0; j<this.numBirds;j++){
            let birdPos = this.birdPositions[j];
            let birdT = t - this.birdCreationTimes[j];
            birdPos = birdPos.times(Mat4.translation(0,Math.sin(2*birdT),2*birdT))
            this.drawBird(context, program_state, birdT, birdPos);
        }
    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;
        varying vec3 vecColor;
        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );
                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
            
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                // Compute the final color with contributions from lights:
                vecColor = phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.

        return this.shared_glsl_code() + `
            void main(){                                                           
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          gl_Position = projection_camera_model_transform * vec4(position,1.0);
          point_position = model_transform * vec4(position,1.0);
          center = model_transform * vec4(0.0,0.0,0.0,1.0);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II). 
        return this.shared_glsl_code() + `
        void main(){
          float d = distance(point_position,center);
          float mult = 30.0;
          gl_FragColor = vec4(0.79*cos(d*mult),0.398*cos(d*mult),0.285*cos(d*mult),1.0);
        }`;
    }
}
