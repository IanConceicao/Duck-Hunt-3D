import {defs, tiny} from './examples/common.js';

const {
    Vector,
    Vector3,
    vec,
    vec3,
    vec4,
    color,
    hex_color,
    Shader,
    Matrix,
    Mat4,
    Light,
    Shape,
    Material,
    Scene,
    Texture
} = tiny;

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


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

class Square extends Shape {
    // **Square** demonstrates two triangles that share vertices.  On any planar surface, the
    // interior edges don't make any important seams.  In these cases there's no reason not
    // to re-use data of the common vertices between triangles.  This makes all the vertex
    // arrays (position, normals, etc) smaller and more cache friendly.
    constructor() {
        super("position", "normal", "texture_coord");
        // Specify the 4 square corner locations, and match those up with normal vectors:
        this.arrays.position = Vector3.cast([-1, 0, -1], [1, 0, -1], [-1, 0, 1], [1, 0, 1]);
        this.arrays.normal = Vector3.cast([0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]);
        // Arrange the vertices into a square shape in texture space too:
        this.arrays.texture_coord = Vector.cast([0, 0], [1, 0], [0, 1], [1, 1]);
        // Use two triangles this time, indexing into four distinct vertices:
        this.indices.push(0, 1, 2, 1, 3, 2);
    }
}

class Blade {

    constructor(i, j, gridsize, angle_amplitude, angle_period) {

        let variation = getRandomArbitrary(-gridsize / 3, gridsize / 3);
        let variation2 = getRandomArbitrary(-gridsize / 3, gridsize / 3);

        this.angle_offset = getRandomArbitrary(-angle_amplitude, angle_amplitude);
        this.period_offset = getRandomArbitrary(-angle_period/7,angle_period/7)
        this.angle_amplitude = angle_amplitude;
        this.angle_period = angle_period;
        this.x_val = variation + gridsize * i;
        this.z_val = variation2 + gridsize * j;
        this.height_scale = getRandomArbitrary(0.8, 1.2);
        this.width_scale = getRandomArbitrary(1, 1.3);
        let random_red = 0.05 + getRandomArbitrary(-0.05,0.05)
        let random_green = 0.5 + getRandomArbitrary(-0.1,0.1)
        let random_blue = 0.1 + getRandomArbitrary(-0.1,0.1)
        this.color = color(random_red,random_green,random_blue,1);
    }

    get_angle(t) {
        return this.angle_amplitude * (Math.sin((2 * Math.PI) / this.angle_period * t + this.period_offset) + this.angle_offset);
    }

    get_position() {
        return vec3(this.x_val, 0, this.z_val)
    }

    get_color(){
        return this.color;
    }

}

export class Grass_Demo extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        //Import data

        this.shapes = {
            'grass': new Shape_From_File("assets/grass-simplified.obj"),

            'square': new Square(),
        };

        this.materials = {
            basic: new Material(new defs.Basic_Shader()),
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            ground: new Material(new defs.Phong_Shader(), {
                ambient: 0.6,
                diffusivity: 1,
                specularity: 1,
                color: hex_color("#5E552A")
            })
            ,
            grass: new Material(new defs.Phong_Shader(), {
                ambient: 0.2,
                diffusivity: 0.2,
                specularity: 0.2,
                color: hex_color("#1C9E32")
            })
        };

        this.make_blades_of_grass();
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));


    }

    make_blades_of_grass() {
        this.blades = [];

        let gridsize = 0.45;
        let period = 10;
        let angle_amplitude = (1 / 30) * Math.PI;


        for (let i = -15; i < 15; i++) { //x cord
            for (let j = -3; j < 3; j++) { //z cord
                var new_blade = new Blade(i, j, gridsize, angle_amplitude, period);
                this.blades.push(new_blade)
            }
        }
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.new_line();
    }

    //Display Func
    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);

        }

        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);

        //Animation time
        const t = program_state.animation_time / 1000
            , dt = program_state.animation_delta_time / 1000;

        //Lights
        const angle = Math.sin(Math.PI/2);
        const light_position = Mat4.rotation(angle, 1, 0, 0).times(vec4(0, 2, 1, 0));
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1),  1000)];

        let model_transform = Mat4.identity();

        //Draw the ground
        //--------------
        let square_transform = Mat4.scale(10, 0, 10).times(model_transform);
        this.shapes.square.draw(context, program_state, square_transform, this.materials.ground);

        //Draw the grass
        //-------------

        //Move up to origin
        let to_origin = Mat4.translation(0, 1.4, 0).times(model_transform); //Move grass up closer to origin

        for (let i = 0; i < this.blades.length; i++) {

            let blade = this.blades[i];

            //Scale
            let scale = Mat4.scale(blade.width_scale, blade.height_scale,1).times(to_origin);

            //Rotate
            let angle = blade.get_angle(t);
            console.log("Angle is: " + angle.toString());
            let rotation = Mat4.rotation(angle, 0, 0, 1).times(scale);

            //Translate
            let position = blade.get_position();
            console.log("Position is: " + position.toString());
            let translate = Mat4.translation(position[0],position[1],position[2]).times(rotation);
            this.shapes.grass.draw(context, program_state, translate, this.materials.grass.override({color: blade.color}));
        }


    }
}
